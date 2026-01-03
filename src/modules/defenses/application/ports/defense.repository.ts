import { Defense } from '../../domain/entities';

export interface FindAllOptions {
  skip?: number;
  take?: number;
  advisorId?: string;
  resultado?: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
}

export interface FindAllResult {
  items: Defense[];
  total: number;
}

export interface IDefenseRepository {
  create(defense: Defense): Promise<Defense>;
  findById(id: string): Promise<Defense | null>;
  findByAdvisorId(advisorId: string): Promise<Defense[]>;
  findAll(options?: FindAllOptions): Promise<FindAllResult>;
  update(defense: Defense): Promise<Defense>;
  hasActiveDefense(studentId: string): Promise<boolean>;
}

export const DEFENSE_REPOSITORY = Symbol('IDefenseRepository');
