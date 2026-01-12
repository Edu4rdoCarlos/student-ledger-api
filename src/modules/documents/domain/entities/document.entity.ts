export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  INACTIVE = 'INACTIVE',
}

export interface DocumentProps {
  version: number;
  documentHash?: string; // SHA-256 hash of the file content
  documentCid?: string; // IPFS CID - filled when submitted to IPFS
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
        documentHash: props.documentHash,
        documentCid: props.documentCid,
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

  get documentHash(): string | undefined {
    return this.props.documentHash;
  }

  get documentCid(): string | undefined {
    return this.props.documentCid;
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

  setDocumentHash(documentHash: string): void {
    this.props.documentHash = documentHash;
    this.props.updatedAt = new Date();
  }

  setDocumentCid(documentCid: string): void {
    this.props.documentCid = documentCid;
    this.props.updatedAt = new Date();
  }

  createNewVersion(hash: string, reason: string): Document {
    return Document.create({
      version: this.props.version + 1,
      documentHash: hash,
      defenseId: this.props.defenseId,
      previousVersionId: this.id,
      changeReason: reason,
    });
  }
}
