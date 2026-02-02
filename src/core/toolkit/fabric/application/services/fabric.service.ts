import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import {
  IFabricGateway,
  FABRIC_GATEWAY,
  FabricUser,
  FabricHealthStatus,
  DocumentRecord,
  DocumentSignature,
  VerifyDocumentResult,
  DefenseResult,
} from '../ports';

@Injectable()
export class FabricService implements OnModuleInit {
  private readonly logger = new Logger(FabricService.name);

  constructor(
    @Inject(FABRIC_GATEWAY)
    private readonly fabricGateway: IFabricGateway,
  ) {}

  async onModuleInit() {
    try {
      await this.healthCheck();
      this.logger.log('Hyperledger Fabric conectado com sucesso');
    } catch (error) {
      this.logger.warn('Hyperledger Fabric offline no init - transações blockchain serão bloqueadas');
      this.logger.error(`Falha ao conectar ao Fabric: ${error.message}`);
    }
  }

  async healthCheck(): Promise<FabricHealthStatus> {
    return this.fabricGateway.healthCheck();
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
    return this.fabricGateway.registerDocument(
      user,
      minutesHash,
      minutesCid,
      evaluationHash,
      evaluationCid,
      matriculas,
      defenseDate,
      notaFinal,
      resultado,
      motivo,
      signatures,
      validatedAt,
    );
  }

  async verifyDocument(user: FabricUser, ipfsCid: string): Promise<VerifyDocumentResult> {
    return this.fabricGateway.verifyDocument(user, ipfsCid);
  }
}
