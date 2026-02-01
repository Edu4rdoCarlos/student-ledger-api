export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  INACTIVE = 'INACTIVE',
}

export enum DocumentType {
  MINUTES = 'minutes',
  EVALUATION = 'evaluation',
}

export const DocumentTypeLabel: Record<DocumentType, string> = {
  [DocumentType.MINUTES]: 'Ata de Defesa',
  [DocumentType.EVALUATION]: 'Avaliação de Desempenho',
};

export interface DocumentProps {
  version: number;
  minutesHash?: string;
  minutesCid?: string;
  evaluationHash?: string;
  evaluationCid?: string;
  status: DocumentStatus;
  changeReason?: string;
  inactivationReason?: string;
  inactivatedAt?: Date;
  blockchainTxId?: string;
  blockchainRegisteredAt?: Date;
  defenseId: string;
  previousVersionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Document {
  private readonly _id: string;
  private props: DocumentProps;

  private constructor(props: DocumentProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  static create(
    props: Partial<DocumentProps> & {
      defenseId: string;
    },
    id?: string,
  ): Document {
    return new Document(
      {
        version: props.version ?? 1,
        minutesHash: props.minutesHash,
        minutesCid: props.minutesCid,
        evaluationHash: props.evaluationHash,
        evaluationCid: props.evaluationCid,
        status: props.status ?? DocumentStatus.PENDING,
        changeReason: props.changeReason,
        inactivationReason: props.inactivationReason,
        inactivatedAt: props.inactivatedAt,
        blockchainTxId: props.blockchainTxId,
        blockchainRegisteredAt: props.blockchainRegisteredAt,
        defenseId: props.defenseId,
        previousVersionId: props.previousVersionId,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get id(): string {
    return this._id;
  }

  get version(): number {
    return this.props.version;
  }

  get minutesHash(): string | undefined {
    return this.props.minutesHash;
  }

  get minutesCid(): string | undefined {
    return this.props.minutesCid;
  }

  get evaluationHash(): string | undefined {
    return this.props.evaluationHash;
  }

  get evaluationCid(): string | undefined {
    return this.props.evaluationCid;
  }

  get status(): DocumentStatus {
    return this.props.status;
  }

  get defenseId(): string {
    return this.props.defenseId;
  }

  get previousVersionId(): string | undefined {
    return this.props.previousVersionId;
  }

  get blockchainTxId(): string | undefined {
    return this.props.blockchainTxId;
  }

  get blockchainRegisteredAt(): Date | undefined {
    return this.props.blockchainRegisteredAt;
  }

  get changeReason(): string | undefined {
    return this.props.changeReason;
  }

  get inactivationReason(): string | undefined {
    return this.props.inactivationReason;
  }

  get inactivatedAt(): Date | undefined {
    return this.props.inactivatedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  isPending(): boolean {
    return this.props.status === DocumentStatus.PENDING;
  }

  isApproved(): boolean {
    return this.props.status === DocumentStatus.APPROVED;
  }

  isInactive(): boolean {
    return this.props.status === DocumentStatus.INACTIVE;
  }

  approve(): void {
    this.props.status = DocumentStatus.APPROVED;
    this.props.updatedAt = new Date();
  }

  inactivate(reason: string): void {
    this.props.status = DocumentStatus.INACTIVE;
    this.props.inactivationReason = reason;
    this.props.inactivatedAt = new Date();
    this.props.updatedAt = new Date();
  }

  registerOnBlockchain(txId: string): void {
    this.props.blockchainTxId = txId;
    this.props.blockchainRegisteredAt = new Date();
    this.props.updatedAt = new Date();
  }

  setMinutesHash(hash: string): void {
    this.props.minutesHash = hash;
    this.props.updatedAt = new Date();
  }

  setMinutesCid(cid: string): void {
    this.props.minutesCid = cid;
    this.props.updatedAt = new Date();
  }

  setEvaluationHash(hash: string): void {
    this.props.evaluationHash = hash;
    this.props.updatedAt = new Date();
  }

  setEvaluationCid(cid: string): void {
    this.props.evaluationCid = cid;
    this.props.updatedAt = new Date();
  }

  createNewVersion(
    documentType: DocumentType,
    hash: string,
    reason: string,
  ): Document {
    const baseProps = {
      version: this.props.version + 1,
      defenseId: this.props.defenseId,
      previousVersionId: this.id,
      changeReason: reason,
      minutesHash: this.props.minutesHash,
      minutesCid: this.props.minutesCid,
      evaluationHash: this.props.evaluationHash,
      evaluationCid: this.props.evaluationCid,
    };

    if (documentType === 'minutes') {
      baseProps.minutesHash = hash;
      baseProps.minutesCid = undefined;
    } else {
      baseProps.evaluationHash = hash;
      baseProps.evaluationCid = undefined;
    }

    return Document.create(baseProps);
  }
}
