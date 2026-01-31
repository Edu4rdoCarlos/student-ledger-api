export class DefenseNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Defesa não encontrada: ${id}` : 'Defesa não encontrada');
    this.name = 'DefenseNotFoundError';
  }
}

export class StudentAlreadyHasActiveDefenseError extends Error {
  constructor(studentId?: string) {
    super(
      studentId
        ? `Estudante já possui uma defesa ativa (PENDENTE ou APROVADA): ${studentId}`
        : 'Estudante já possui uma defesa ativa (PENDENTE ou APROVADA)',
    );
    this.name = 'StudentAlreadyHasActiveDefenseError';
  }
}

export class TooManyStudentsError extends Error {
  constructor() {
    super('Defesa pode ter no máximo 2 estudantes');
    this.name = 'TooManyStudentsError';
  }
}

export class InvalidGradeError extends Error {
  constructor(grade: number) {
    super(`Nota inválida: ${grade}. A nota deve estar entre 0 e 10`);
    this.name = 'InvalidGradeError';
  }
}
