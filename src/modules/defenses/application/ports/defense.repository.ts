import { Defense } from '../../domain/entities';

export interface FindAllOptions {
  skip?: number;
  take?: number;
  order?: 'asc' | 'desc';
  courseIds?: string[];
  search?: string;
}

export interface FindAllResult {
  items: Defense[];
  total: number;
}

export interface IDefenseRepository {
  create(defense: Defense): Promise<Defense>;
  findById(id: string): Promise<Defense | null>;
  findByAdvisorId(advisorId: string): Promise<Defense[]>;
  findByStudentId(studentId: string): Promise<Defense[]>;
  findAll(options?: FindAllOptions): Promise<FindAllResult>;
  update(defense: Defense): Promise<Defense>;
  hasActiveDefense(studentId: string): Promise<boolean>;
  getDefenseCourseId(defenseId: string): Promise<string | null>;
}

export const DEFENSE_REPOSITORY = Symbol('IDefenseRepository');
