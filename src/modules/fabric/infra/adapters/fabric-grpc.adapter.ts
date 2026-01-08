import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers, Gateway } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
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

  private readonly organizations: Record<OrgName, OrgConfig>;

  private readonly roleToOrgMap: Record<UserRole, OrgName> = {
    ADMIN: 'coordenacao',
    COORDINATOR: 'coordenacao',
    ADVISOR: 'orientador',
    STUDENT: 'aluno',
  };

  constructor(private configService: ConfigService) {
    this.channelName = this.configService.get<string>('FABRIC_CHANNEL', 'studentchannel');
    this.chaincodeName = this.configService.get<string>('FABRIC_CHAINCODE', 'student-ledger');

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

  async healthCheck(): Promise<FabricHealthStatus> {
    try {
      const orgConfig = this.organizations.coordenacao;
      const certsBasePath = path.resolve(process.cwd(), 'src/blockchain/certs');
      const certPath = path.join(certsBasePath, 'coordenacao', 'cert.pem');
      const keyPath = path.join(certsBasePath, 'coordenacao', 'key.pem');
      const tlsCertPath = path.join(certsBasePath, 'coordenacao', 'tls-ca.crt');

      if (!fs.existsSync(certPath)) {
        throw new FabricCertificateNotFoundError('Certificado', certPath);
      }
      if (!fs.existsSync(keyPath)) {
        throw new FabricCertificateNotFoundError('Chave privada', keyPath);
      }
      if (!fs.existsSync(tlsCertPath)) {
        throw new FabricCertificateNotFoundError('TLS CA', tlsCertPath);
      }

      const tlsCredentials = grpc.credentials.createSsl(fs.readFileSync(tlsCertPath));
      const client = new grpc.Client(orgConfig.peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': orgConfig.peerName,
      });

      const identity = await this.createIdentity(certPath, orgConfig.mspId);
      const signer = await this.createSigner(keyPath);

      const gateway = connect({
        client,
        identity,
        signer,
        evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
      });

      const network = gateway.getNetwork(this.channelName);
      const contract = network.getContract(this.chaincodeName);

      // Fazer uma chamada real ao chaincode para verificar conectividade
      await contract.evaluateTransaction('HealthCheck');

      gateway.close();
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

    const certsBasePath = path.resolve(process.cwd(), 'src/blockchain/certs');
    const certPath = path.join(certsBasePath, orgName, 'cert.pem');
    const keyPath = path.join(certsBasePath, orgName, 'key.pem');
    const tlsCertPath = path.join(certsBasePath, orgName, 'tls-ca.crt');

    if (!fs.existsSync(certPath)) {
      throw new FabricCertificateNotFoundError('Certificado', certPath);
    }
    if (!fs.existsSync(keyPath)) {
      throw new FabricCertificateNotFoundError('Chave privada', keyPath);
    }
    if (!fs.existsSync(tlsCertPath)) {
      throw new FabricCertificateNotFoundError('TLS CA', tlsCertPath);
    }

    const tlsCredentials = grpc.credentials.createSsl(fs.readFileSync(tlsCertPath));

    const client = new grpc.Client(orgConfig.peerEndpoint, tlsCredentials, {
      'grpc.ssl_target_name_override': orgConfig.peerName,
    });

    const identity = await this.createIdentity(certPath, orgConfig.mspId);
    const signer = await this.createSigner(keyPath);

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

  private async createIdentity(certPath: string, mspId: string): Promise<Identity> {
    const credentials = fs.readFileSync(certPath);
    return { mspId, credentials };
  }

  private async createSigner(keyPath: string): Promise<Signer> {
    const privateKeyPem = fs.readFileSync(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
  }

  async registerDocument(
    user: FabricUser,
    documentHash: string,
    ipfsCid: string,
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
          documentHash,
          ipfsCid,
          JSON.stringify(matriculas),
          defenseDate,
          notaFinal.toString(),
          resultado,
          motivo,
          'APPROVED',
          JSON.stringify(signatures),
          validatedAt,
        );
        return JSON.parse(result.toString());
      } catch (error) {
        throw new FabricTransactionError('registerDocument', error.message);
      }
    });
  }

  async verifyDocument(user: FabricUser, ipfsCid: string): Promise<VerifyDocumentResult> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('verifyDocument', ipfsCid);
        return JSON.parse(result.toString());
      } catch (error) {
        throw new FabricTransactionError('verifyDocument', error.message);
      }
    });
  }

  async getLatestDocument(user: FabricUser, matricula: string): Promise<DocumentRecord> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('getLatestDocument', matricula);
        return JSON.parse(result.toString());
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
        return JSON.parse(result.toString());
      } catch (error) {
        throw new FabricTransactionError('getDocument', error.message);
      }
    });
  }

  async getDocumentHistory(user: FabricUser, matricula: string): Promise<DocumentRecord[]> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('getDocumentHistory', matricula);
        return JSON.parse(result.toString());
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
        return JSON.parse(result.toString());
      } catch (error) {
        throw new FabricTransactionError('getDocumentModificationHistory', error.message);
      }
    });
  }

  async getApprovedDocument(user: FabricUser, matricula: string): Promise<DocumentRecord> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('getApprovedDocument', matricula);
        return JSON.parse(result.toString());
      } catch (error) {
        throw new FabricTransactionError('getApprovedDocument', error.message);
      }
    });
  }

  async documentExists(user: FabricUser, matricula: string): Promise<boolean> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('documentExists', matricula);
        return JSON.parse(result.toString());
      } catch (error) {
        throw new FabricTransactionError('documentExists', error.message);
      }
    });
  }

  async getVersionCount(user: FabricUser, matricula: string): Promise<number> {
    return this.withConnection(user, async (connection) => {
      try {
        const result = await connection.contract.evaluateTransaction('getVersionCount', matricula);
        return JSON.parse(result.toString());
      } catch (error) {
        throw new FabricTransactionError('getVersionCount', error.message);
      }
    });
  }
}
