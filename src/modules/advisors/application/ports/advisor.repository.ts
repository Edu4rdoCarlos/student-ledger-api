import { Advisor } from '../../domain/entities';

export interface FindAllOptions {
  skip?: number;
  take?: number;
  courseId?: string;
}

export interface FindAllResult {
  items: Advisor[];
  total: number;
}

export interface IAdvisorRepository {
  create(advisor: Advisor): Promise<Advisor>;
  findById(id: string): Promise<Advisor | null>;
  findByUserId(userId: string): Promise<Advisor | null>;
  findByCourseId(courseId: string): Promise<Advisor[]>;
  findAll(options?: FindAllOptions): Promise<FindAllResult>;
  update(advisor: Advisor): Promise<Advisor>;
  existsByUserId(userId: string): Promise<boolean>;
}

export const ADVISOR_REPOSITORY = Symbol('IAdvisorRepository');
