import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers, Gateway } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import * as fs from 'fs';
import {
  IFabricGateway,
  FabricUser,
  FabricHealthStatus,
  DocumentRecord,
  DocumentSignature,
  VerifyDocumentResult,
  OrgName,
  UserRole,
  DefenseResult,
  ICertificateRepository,
  CERTIFICATE_REPOSITORY,
} from '../../application/ports';
import {
  FabricConnectionError,
  FabricCertificateNotFoundError,
  FabricTransactionError,
} from '../../domain/errors';

interface OrgConfig {
  name: OrgName;
  mspId: string;
  peerEndpoint: string;
  peerName: string;
}

interface FabricConnection {
  gateway: Gateway;
  client: grpc.Client;
  contract: Contract;
  orgConfig: OrgConfig;
}

@Injectable()
export class FabricGrpcAdapter implements IFabricGateway {
  private readonly logger = new Logger(FabricGrpcAdapter.name);
  private readonly channelName: string;
  private readonly chaincodeName: string;
  private readonly tlsCaCertPath: string;
  private readonly tlsCaCertPem: string;

  private readonly organizations: Record<OrgName, OrgConfig>;

  private readonly roleToOrgMap: Record<UserRole, OrgName> = {
    ADMIN: 'coordenacao',
    COORDINATOR: 'coordenacao',
    ADVISOR: 'orientador',
    STUDENT: 'aluno',
  };

  constructor(
    private configService: ConfigService,
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certRepository: ICertificateRepository,
  ) {
    this.channelName = this.configService.get<string>('FABRIC_CHANNEL', 'studentchannel');
    this.chaincodeName = this.configService.get<string>('FABRIC_CHAINCODE', 'student-ledger');
    this.tlsCaCertPath = this.configService.get<string>('FABRIC_TLS_CA_CERT_PATH', '');
    this.tlsCaCertPem = this.configService.get<string>('FABRIC_TLS_CA_CERT', '');

    this.organizations = {
      coordenacao: {
        name: 'coordenacao',
        mspId: this.configService.get<string>('FABRIC_COORDENACAO_MSP_ID', 'CoordenacaoMSP'),
        peerEndpoint: this.configService.get<string>('FABRIC_COORDENACAO_PEER_ENDPOINT', 'localhost:7051'),
        peerName: this.configService.get<string>(
          'FABRIC_COORDENACAO_PEER_NAME',
          'peer0.coordenacao.ifal.local',
        ),
      },
      orientador: {
        name: 'orientador',
        mspId: this.configService.get<string>('FABRIC_ORIENTADOR_MSP_ID', 'OrientadorMSP'),
        peerEndpoint: this.configService.get<string>('FABRIC_ORIENTADOR_PEER_ENDPOINT', 'localhost:8051'),
        peerName: this.configService.get<string>(
          'FABRIC_ORIENTADOR_PEER_NAME',
          'peer0.orientador.ifal.local',
        ),
      },
      aluno: {
        name: 'aluno',
        mspId: this.configService.get<string>('FABRIC_ALUNO_MSP_ID', 'AlunoMSP'),
        peerEndpoint: this.configService.get<string>('FABRIC_ALUNO_PEER_ENDPOINT', 'localhost:9051'),
        peerName: this.configService.get<string>('FABRIC_ALUNO_PEER_NAME', 'peer0.aluno.ifal.local'),
      },
    };
  }

  private getTlsCredentials(): grpc.ChannelCredentials {
    // Prioridade: PEM inline > path de arquivo
    if (this.tlsCaCertPem) {
      const tlsRootCert = Buffer.from(this.tlsCaCertPem);
      return grpc.credentials.createSsl(tlsRootCert);
    }

    if (this.tlsCaCertPath) {
      if (!fs.existsSync(this.tlsCaCertPath)) {
        throw new FabricCertificateNotFoundError('TLS CA', this.tlsCaCertPath);
      }
      const tlsRootCert = fs.readFileSync(this.tlsCaCertPath);
      return grpc.credentials.createSsl(tlsRootCert);
    }

    throw new FabricCertificateNotFoundError(
      'TLS CA',
      'Configure FABRIC_TLS_CA_CERT (PEM inline) ou FABRIC_TLS_CA_CERT_PATH (caminho do arquivo)',
    );
  }

  async healthCheck(): Promise<FabricHealthStatus> {
    try {
      const orgConfig = this.organizations.coordenacao;
      const tlsCredentials = this.getTlsCredentials();

      const client = new grpc.Client(orgConfig.peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': orgConfig.peerName,
        'grpc.default_authority': orgConfig.peerName,
      });

      // Verificar conectividade TLS com o peer sem precisar de identidade
      await new Promise<void>((resolve, reject) => {
        const deadline = Date.now() + 5000;
        client.waitForReady(deadline, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      client.close();

      return { status: 'ok', message: 'Fabric conectado com sucesso' };
    } catch (error) {
      this.logger.error(`Falha no health check do Fabric: ${error.message}`);
      throw new FabricConnectionError(error.message);
    }
  }

  getOrgForRole(role: UserRole): OrgName {
    return this.roleToOrgMap[role];
  }

  getMspIdForRole(role: 'coordenador' | 'orientador' | 'aluno'): string {
    const mspMap: Record<string, string> = {
      coordenador: 'CoordenacaoMSP',
      orientador: 'OrientadorMSP',
      aluno: 'AlunoMSP',
    };
    return mspMap[role];
  }

  private async createConnection(user: FabricUser): Promise<FabricConnection> {
    const orgName = this.getOrgForRole(user.role);
    const orgConfig = this.organizations[orgName];

    const certData = await this.certRepository.findActiveByUserId(user.id);
    if (!certData) {
      throw new FabricCertificateNotFoundError(
        'Certificado',
        `Nenhum certificado ativo encontrado para o usuário ${user.id}`,
      );
    }

    const tlsCredentials = this.getTlsCredentials();

    const client = new grpc.Client(orgConfig.peerEndpoint, tlsCredentials, {
      'grpc.ssl_target_name_override': orgConfig.peerName,
      'grpc.default_authority': orgConfig.peerName,
    });

    const identity = this.createIdentityFromPem(certData.certificate, certData.mspId);
    const signer = this.createSignerFromPem(certData.privateKey);

    const gateway = connect({
      client,
      identity,
      signer,
      evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
      endorseOptions: () => ({ deadline: Date.now() + 15000 }),
      submitOptions: () => ({ deadline: Date.now() + 5000 }),
      commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
    });

    const network = gateway.getNetwork(this.channelName);
    const contract = network.getContract(this.chaincodeName, 'DocumentContract');

    return {
      gateway,
      client,
      contract,
      orgConfig,
    };
  }

  private closeConnection(connection: FabricConnection): void {
    connection.gateway.close();
    connection.client.close();
  }

  private async withConnection<T>(
    user: FabricUser,
    operation: (connection: FabricConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.createConnection(user);
    try {
      return await operation(connection);
    } finally {
      this.closeConnection(connection);
    }
  }

  private createIdentityFromPem(certPem: string, mspId: string): Identity {
    const credentials = Buffer.from(certPem);
    return { mspId, credentials };
  }

  private createSignerFromPem(privateKeyPem: string): Signer {
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
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
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.submitTransaction(
          'registerDocument',
          minutesHash,
          minutesCid,
          evaluationHash,
          evaluationCid,
          JSON.stringify(matriculas),
          defenseDate,
          notaFinal.toString(),
          resultado,
          motivo,
          'APPROVED',
          JSON.stringify(signatures),
          validatedAt,
        );
        return JSON.parse(Buffer.from(result).toString('utf-8'));
      } catch (error) {
        throw new FabricTransactionError('registerDocument', error.message);
      }
    });
  }

  async verifyDocument(user: FabricUser, ipfsCid: string): Promise<VerifyDocumentResult> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('verifyDocument', ipfsCid);
        return JSON.parse(Buffer.from(result).toString('utf-8'));
      } catch (error) {
        throw new FabricTransactionError('verifyDocument', error.message);
      }
    });
  }

  async getLatestDocument(user: FabricUser, matricula: string): Promise<DocumentRecord> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('getLatestDocument', matricula);
        return JSON.parse(Buffer.from(result).toString('utf-8'));
      } catch (error) {
        throw new FabricTransactionError('getLatestDocument', error.message);
      }
    });
  }

  async getDocument(user: FabricUser, matricula: string, versao: number): Promise<DocumentRecord> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction(
          'getDocument',
          matricula,
          versao.toString(),
        );
        return JSON.parse(Buffer.from(result).toString('utf-8'));
      } catch (error) {
        throw new FabricTransactionError('getDocument', error.message);
      }
    });
  }

  async getDocumentHistory(user: FabricUser, matricula: string): Promise<DocumentRecord[]> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('getDocumentHistory', matricula);
        const resultString = Buffer.from(result).toString('utf-8');

        if (!resultString || resultString.trim().length === 0) {
          return [];
        }

        return JSON.parse(resultString);
      } catch (error) {
        throw new FabricTransactionError('getDocumentHistory', error.message);
      }
    });
  }

  async getDocumentModificationHistory(
    user: FabricUser,
    matricula: string,
    versao: number,
  ): Promise<any[]> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction(
          'getDocumentModificationHistory',
          matricula,
          versao.toString(),
        );
        return JSON.parse(Buffer.from(result).toString('utf-8'));
      } catch (error) {
        throw new FabricTransactionError('getDocumentModificationHistory', error.message);
      }
    });
  }

  async getApprovedDocument(user: FabricUser, matricula: string): Promise<DocumentRecord> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('getApprovedDocument', matricula);
        return JSON.parse(Buffer.from(result).toString('utf-8'));
      } catch (error) {
        throw new FabricTransactionError('getApprovedDocument', error.message);
      }
    });
  }

  async documentExists(user: FabricUser, matricula: string): Promise<boolean> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('documentExists', matricula);
        return JSON.parse(Buffer.from(result).toString('utf-8'));
      } catch (error) {
        throw new FabricTransactionError('documentExists', error.message);
      }
    });
  }

  async getVersionCount(user: FabricUser, matricula: string): Promise<number> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('getVersionCount', matricula);
        return JSON.parse(Buffer.from(result).toString('utf-8'));
      } catch (error) {
        throw new FabricTransactionError('getVersionCount', error.message);
      }
    });
  }
}
