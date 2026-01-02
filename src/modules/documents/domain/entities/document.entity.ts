export enum DocumentType {
  ATA = 'ATA',
  FICHA = 'FICHA',
}

export enum DocumentStatus {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  INATIVO = 'INATIVO',
}

export interface DocumentProps {
  tipo: DocumentType;
  versao: number;
  documentoHash: string;
  arquivoPath?: string;
  status: DocumentStatus;
  motivoAlteracao?: string;
  motivoInativacao?: string;
  dataInativacao?: Date;
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
      tipo: DocumentType;
      documentoHash: string;
      defenseId: string;
    },
    id?: string,
  ): Document {
    return new Document(
      {
        tipo: props.tipo,
        versao: props.versao ?? 1,
        documentoHash: props.documentoHash,
        arquivoPath: props.arquivoPath,
        status: props.status ?? DocumentStatus.PENDENTE,
        motivoAlteracao: props.motivoAlteracao,
        motivoInativacao: props.motivoInativacao,
        dataInativacao: props.dataInativacao,
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

  get tipo(): DocumentType {
    return this.props.tipo;
  }

  get versao(): number {
    return this.props.versao;
  }

  get documentoHash(): string {
    return this.props.documentoHash;
  }

  get arquivoPath(): string | undefined {
    return this.props.arquivoPath;
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

  get motivoAlteracao(): string | undefined {
    return this.props.motivoAlteracao;
  }

  get motivoInativacao(): string | undefined {
    return this.props.motivoInativacao;
  }

  get dataInativacao(): Date | undefined {
    return this.props.dataInativacao;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  isPending(): boolean {
    return this.props.status === DocumentStatus.PENDENTE;
  }

  isApproved(): boolean {
    return this.props.status === DocumentStatus.APROVADO;
  }

  isInactive(): boolean {
    return this.props.status === DocumentStatus.INATIVO;
  }

  approve(): void {
    this.props.status = DocumentStatus.APROVADO;
    this.props.updatedAt = new Date();
  }

  inactivate(motivo: string): void {
    this.props.status = DocumentStatus.INATIVO;
    this.props.motivoInativacao = motivo;
    this.props.dataInativacao = new Date();
    this.props.updatedAt = new Date();
  }

  registerOnBlockchain(txId: string): void {
    this.props.blockchainTxId = txId;
    this.props.blockchainRegisteredAt = new Date();
    this.props.updatedAt = new Date();
  }

  createNewVersion(hash: string, motivo: string): Document {
    return Document.create({
      tipo: this.props.tipo,
      versao: this.props.versao + 1,
      documentoHash: hash,
      defenseId: this.props.defenseId,
      previousVersionId: this.id,
      motivoAlteracao: motivo,
    });
  }
}
