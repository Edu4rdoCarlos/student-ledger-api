import { Injectable, Inject, Logger } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers, Gateway } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import {
  IFabricGateway,
  FabricUser,
  FabricHealthStatus,
  DocumentRecord,
  DocumentSignature,
  VerifyDocumentResult,
  DefenseResult,
  ICertificateRepository,
  CERTIFICATE_REPOSITORY,
} from '../../application/ports';
import {
  FabricConnectionError,
  FabricCertificateNotFoundError,
  FabricTransactionError,
} from '../../domain/errors';
import { FabricOrganizationConfig, PeerConfig } from '../config/fabric-organization.config';
import { FabricNetworkConfig, NetworkTimeouts } from '../config/fabric-network.config';

@Injectable()
export class FabricGrpcAdapter implements IFabricGateway {
  private readonly logger = new Logger(FabricGrpcAdapter.name);

  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certRepository: ICertificateRepository,
    private readonly fabricOrgConfig: FabricOrganizationConfig,
    private readonly fabricNetConfig: FabricNetworkConfig,
  ) {}

  async healthCheck(): Promise<FabricHealthStatus> {
    try {
      const peerConfig = this.fabricOrgConfig.getPeerConfig('coordenacao');
      const client = this.createGrpcClient(peerConfig);

      await this.waitForClientReady(client, this.fabricNetConfig.getHealthCheckTimeout());

      client.close();

      return { status: 'ok', message: 'Fabric conectado com sucesso' };
    } catch (error) {
      this.logger.error(`Falha no health check do Fabric: ${error.message}`);
      throw new FabricConnectionError(error.message);
    }
  }

  async registerDocument(
    user: FabricUser,
    minutesHash: string,
    minutesCid: string,
    evaluationHash: string,
    evaluationCid: string,
    matriculas: string[],
    defenseDate: string,
    notaFinal: number,
    resultado: DefenseResult,
    motivo: string,
    signatures: DocumentSignature[],
    validatedAt: string,
  ): Promise<DocumentRecord> {
    return this.executeWriteTransaction(user, async (contract: Contract) => {
      const resultadoPt = resultado === DefenseResult.APPROVED ? 'APROVADO' : 'REPROVADO';

      const result = await contract.submitTransaction(
        'registerDocument',
        minutesHash,
        minutesCid,
        evaluationHash,
        evaluationCid,
        JSON.stringify(matriculas),
        defenseDate,
        notaFinal.toString(),
        resultadoPt,
        motivo,
        'APROVADO',
        JSON.stringify(signatures),
        validatedAt,
      );

      return JSON.parse(Buffer.from(result).toString('utf-8'));
    });
  }

  async verifyDocument(user: FabricUser, ipfsCid: string): Promise<VerifyDocumentResult> {
    return this.executeReadTransaction(user, async (contract: Contract) => {
      const result = await contract.evaluateTransaction('verifyDocument', ipfsCid);
      return JSON.parse(Buffer.from(result).toString('utf-8'));
    });
  }

  private async executeReadTransaction<T>(
    user: FabricUser,
    operation: (contract: Contract) => Promise<T>,
  ): Promise<T> {
    const orgName = this.fabricOrgConfig.getOrgNameByUserRole(user.role);
    const peerConfig = this.fabricOrgConfig.getPeerConfig(orgName);
    const certData = await this.getCertificate(user.id);
    const timeouts = this.fabricNetConfig.getReadTimeouts();

    return this.executeWithGateway(peerConfig, certData.certificate, certData.privateKey, certData.mspId, timeouts, operation);
  }

  private async executeWriteTransaction<T>(
    user: FabricUser,
    operation: (contract: Contract) => Promise<T>,
  ): Promise<T> {
    const peerConfig = this.fabricOrgConfig.getPeerConfig('coordenacao');
    const certData = await this.getCertificate(user.id, peerConfig.mspId);
    const timeouts = this.fabricNetConfig.getWriteTimeouts();

    this.logger.log(`Conectado ao peer ${peerConfig.peerName} para transação de escrita`);

    return this.executeWithGateway(peerConfig, certData.certificate, certData.privateKey, certData.mspId, timeouts, operation);
  }

  private async executeWithGateway<T>(
    peerConfig: PeerConfig,
    certificate: string,
    privateKey: string,
    mspId: string,
    timeouts: NetworkTimeouts,
    operation: (contract: Contract) => Promise<T>,
  ): Promise<T> {
    const client = this.createGrpcClient(peerConfig);

    try {
      const gateway = this.createGateway(client, certificate, privateKey, mspId, timeouts);

      try {
        const network = gateway.getNetwork(this.fabricNetConfig.getChannelName());
        const contract = network.getContract(
          this.fabricNetConfig.getChaincodeName(),
          this.fabricNetConfig.getContractName(),
        );
        return await operation(contract);
      } catch (error) {
        const errorInfo = {
          message: error instanceof Error ? error.message : String(error),
          code: (error as any)?.code,
          details: (error as any)?.details,
        };
        this.logger.error(`Transaction error: ${JSON.stringify(errorInfo)}`);
        throw new FabricTransactionError('transaction', errorInfo.message);
      } finally {
        gateway.close();
      }
    } finally {
      client.close();
    }
  }

  private async getCertificate(userId: string, mspId?: string) {
    const certData = mspId
      ? await this.certRepository.findActiveByUserIdAndMspId(userId, mspId)
      : await this.certRepository.findActiveByUserId(userId);

    if (!certData) {
      const msg = mspId
        ? `Nenhum certificado ${mspId} ativo encontrado para o usuário ${userId}.`
        : `Nenhum certificado ativo encontrado para o usuário ${userId}`;
      throw new FabricCertificateNotFoundError('Certificado', msg);
    }
    return certData;
  }

  private createGrpcClient(peerConfig: PeerConfig): grpc.Client {
    if (!peerConfig.tlsCaCert) {
      throw new FabricCertificateNotFoundError(
        'TLS CA',
        `Configure FABRIC_${peerConfig.name.toUpperCase()}_TLS_CA_CERT para a organização ${peerConfig.name}`,
      );
    }

    const tlsCredentials = grpc.credentials.createSsl(Buffer.from(peerConfig.tlsCaCert));

    return new grpc.Client(peerConfig.peerEndpoint, tlsCredentials, {
      'grpc.ssl_target_name_override': peerConfig.peerName,
      'grpc.default_authority': peerConfig.peerName,
    });
  }

  private createGateway(
    client: grpc.Client,
    certificate: string,
    privateKey: string,
    mspId: string,
    timeouts: NetworkTimeouts,
  ): Gateway {
    const identity: Identity = { mspId, credentials: Buffer.from(certificate) };
    const privateKeyObj = crypto.createPrivateKey(privateKey);
    const signer = signers.newPrivateKeySigner(privateKeyObj);

    return connect({
      client,
      identity,
      signer,
      evaluateOptions: () => ({ deadline: Date.now() + timeouts.evaluate }),
      endorseOptions: () => ({ deadline: Date.now() + timeouts.endorse }),
      submitOptions: () => ({ deadline: Date.now() + timeouts.submit }),
      commitStatusOptions: () => ({ deadline: Date.now() + timeouts.commitStatus }),
    });
  }

  private waitForClientReady(client: grpc.Client, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeout;
      client.waitForReady(deadline, (error: Error | undefined) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
