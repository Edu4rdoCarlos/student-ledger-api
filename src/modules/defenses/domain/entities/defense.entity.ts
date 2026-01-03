export interface DefenseProps {
  titulo: string;
  dataDefesa: Date;
  notaFinal?: number;
  resultado: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
  advisorId: string;
  studentIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Defense {
  private readonly _id: string;
  private props: DefenseProps;

  private constructor(props: DefenseProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  static create(props: DefenseProps, id?: string): Defense {
    if (props.studentIds.length === 0) {
      throw new Error('Defesa deve ter pelo menos 1 estudante');
    }
    if (props.studentIds.length > 2) {
      throw new Error('Defesa pode ter no máximo 2 estudantes');
    }

    return new Defense(
      {
        ...props,
        resultado: props.resultado ?? 'PENDENTE',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get id(): string {
    return this._id;
  }

  get titulo(): string {
    return this.props.titulo;
  }

  get dataDefesa(): Date {
    return this.props.dataDefesa;
  }

  get notaFinal(): number | undefined {
    return this.props.notaFinal;
  }

  get resultado(): 'PENDENTE' | 'APROVADO' | 'REPROVADO' {
    return this.props.resultado;
  }

  get advisorId(): string {
    return this.props.advisorId;
  }

  get studentIds(): string[] {
    return this.props.studentIds;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  setNota(nota: number): void {
    if (nota < 0 || nota > 10) {
      throw new Error('Nota deve estar entre 0 e 10');
    }

    this.props.notaFinal = nota;
    this.props.resultado = nota >= 7 ? 'APROVADO' : 'REPROVADO';
    this.props.updatedAt = new Date();
  }

  update(data: Partial<Pick<DefenseProps, 'titulo' | 'dataDefesa'>>): void {
    if (data.titulo !== undefined) this.props.titulo = data.titulo;
    if (data.dataDefesa !== undefined) this.props.dataDefesa = data.dataDefesa;
    this.props.updatedAt = new Date();
  }
}
