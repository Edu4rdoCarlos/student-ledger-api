import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers, Gateway } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

type OrgName = 'coordenacao' | 'orientador' | 'aluno';

interface OrgConfig {
  name: OrgName;
  mspId: string;
  peerEndpoint: string;
  peerName: string;
}

interface DocumentSignature {
  role: 'orientador' | 'aluno' | 'coordenador';
  email: string;
  mspId: string;
  timestamp: string;
}

@Injectable()
export class FabricService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FabricService.name);
  private gateway: Gateway;
  private client: grpc.Client;
  private currentOrg: OrgConfig;

  private documentWriteContract: Contract;
  private documentReadContract: Contract;

  private readonly organizations: Record<OrgName, OrgConfig> = {
    coordenacao: {
      name: 'coordenacao',
      mspId: 'CoordenacaoMSP',
      peerEndpoint: 'localhost:7051',
      peerName: 'peer0.coordenacao.ifal.local',
    },
    orientador: {
      name: 'orientador',
      mspId: 'OrientadorMSP',
      peerEndpoint: 'localhost:8051',
      peerName: 'peer0.orientador.ifal.local',
    },
    aluno: {
      name: 'aluno',
      mspId: 'AlunoMSP',
      peerEndpoint: 'localhost:9051',
      peerName: 'peer0.aluno.ifal.local',
    },
  };

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const defaultOrg = this.configService.get<OrgName>('FABRIC_DEFAULT_ORG', 'coordenacao');
    await this.connect(defaultOrg);
  }

  async onModuleDestroy() {
    this.gateway?.close();
    this.client?.close();
  }

  async connect(orgName: OrgName = 'coordenacao') {
    try {
      this.logger.log(`Conectando ao Fabric como ${orgName}...`);

      const orgConfig = this.organizations[orgName];
      if (!orgConfig) {
        throw new Error(`Organizacao ${orgName} nao encontrada`);
      }

      this.currentOrg = orgConfig;

      const certsBasePath = path.resolve(__dirname, '../../blockchain/certs');
      const certPath = path.join(certsBasePath, orgName, 'cert.pem');
      const keyPath = path.join(certsBasePath, orgName, 'key.pem');
      const tlsCertPath = path.join(certsBasePath, orgName, 'tls-ca.crt');

      if (!fs.existsSync(certPath)) {
        throw new Error(`Certificado nao encontrado: ${certPath}`);
      }
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Chave privada nao encontrada: ${keyPath}`);
      }
      if (!fs.existsSync(tlsCertPath)) {
        throw new Error(`TLS CA nao encontrado: ${tlsCertPath}`);
      }

      const tlsCredentials = grpc.credentials.createSsl(fs.readFileSync(tlsCertPath));

      if (this.client) {
        this.client.close();
      }

      this.client = new grpc.Client(orgConfig.peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': orgConfig.peerName,
      });

      const identity = await this.createIdentity(certPath, orgConfig.mspId);
      const signer = await this.createSigner(keyPath);

      if (this.gateway) {
        this.gateway.close();
      }

      this.gateway = connect({
        client: this.client,
        identity,
        signer,
        evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
        endorseOptions: () => ({ deadline: Date.now() + 15000 }),
        submitOptions: () => ({ deadline: Date.now() + 5000 }),
        commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
      });

      const channelName = this.configService.get<string>('FABRIC_CHANNEL', 'studentchannel');
      const network = this.gateway.getNetwork(channelName);

      this.documentWriteContract = network.getContract('studentledger', 'DocumentWriteContract');
      this.documentReadContract = network.getContract('studentledger', 'DocumentReadContract');

      this.logger.log(`Conectado ao Fabric como ${orgConfig.mspId}`);
    } catch (error) {
      this.logger.error(`Erro ao conectar ao Fabric: ${error.message}`);
      throw error;
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

  getCurrentOrg(): OrgConfig {
    return this.currentOrg;
  }

  getMspIdForRole(role: 'coordenador' | 'orientador' | 'aluno'): string {
    const mspMap: Record<string, string> = {
      coordenador: 'CoordenacaoMSP',
      orientador: 'OrientadorMSP',
      aluno: 'AlunoMSP',
    };
    return mspMap[role];
  }

  // ============================================
  // DOCUMENT WRITE CONTRACT
  // ============================================

  async registerDocument(
    documentHash: string,
    matricula: string,
    defenseDate: string,
    notaFinal: number,
    resultado: 'APROVADO' | 'REPROVADO',
    motivo: string,
    status: string,
    signatures: DocumentSignature[],
    validatedAt: string,
  ) {
    const result = await this.documentWriteContract.submitTransaction(
      'registerDocument',
      documentHash,
      matricula,
      defenseDate,
      notaFinal.toString(),
      resultado,
      motivo,
      status,
      JSON.stringify(signatures),
      validatedAt,
    );
    return JSON.parse(result.toString());
  }

  // ============================================
  // DOCUMENT READ CONTRACT
  // ============================================

  async getDocumentByMatriculaAndVersion(matricula: string, versao: number) {
    const result = await this.documentReadContract.evaluateTransaction(
      'getDocumentByMatriculaAndVersion',
      matricula,
      versao.toString(),
    );
    return JSON.parse(result.toString());
  }

  async validateDocument(documentHash: string) {
    const result = await this.documentReadContract.evaluateTransaction('validateDocument', documentHash);
    return JSON.parse(result.toString());
  }

  async getDocumentsByMatricula(matricula: string) {
    const result = await this.documentReadContract.evaluateTransaction('getDocumentsByMatricula', matricula);
    return JSON.parse(result.toString());
  }

  async getDocumentHistory(documentHash: string) {
    const result = await this.documentReadContract.evaluateTransaction('getDocumentHistory', documentHash);
    return JSON.parse(result.toString());
  }
}
