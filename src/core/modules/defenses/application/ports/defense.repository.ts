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

export interface DefenseSummary {
  id: string;
  title: string;
  defenseDate: Date;
  result: string;
  status: string;
}

export interface DefenseEvent {
  defenseId: string;
  type: 'CANCELED' | 'RESCHEDULED';
  reason: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface IDefenseRepository {
  create(defense: Defense): Promise<Defense>;
  findById(id: string): Promise<Defense | null>;
  findByAdvisorId(advisorId: string): Promise<Defense[]>;
  findByStudentId(studentId: string): Promise<Defense[]>;
  findSummaryByAdvisorId(advisorId: string): Promise<DefenseSummary[]>;
  findSummaryByStudentId(studentId: string): Promise<DefenseSummary[]>;
  countByAdvisorId(advisorId: string): Promise<number>;
  countByStudentId(studentId: string): Promise<number>;
  findAll(options?: FindAllOptions): Promise<FindAllResult>;
  update(defense: Defense): Promise<Defense>;
  hasActiveDefense(studentId: string): Promise<boolean>;
  getDefenseCourseId(defenseId: string): Promise<string | null>;
  createEvent(event: DefenseEvent): Promise<void>;
}

export const DEFENSE_REPOSITORY = Symbol('IDefenseRepository');
