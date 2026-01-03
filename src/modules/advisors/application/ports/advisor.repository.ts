import { Advisor } from '../../domain/entities';

export interface IAdvisorRepository {
  create(advisor: Advisor): Promise<Advisor>;
  findById(id: string): Promise<Advisor | null>;
  findByUserId(userId: string): Promise<Advisor | null>;
  findByCourseId(courseId: string): Promise<Advisor[]>;
  findAll(): Promise<Advisor[]>;
  update(advisor: Advisor): Promise<Advisor>;
  existsByUserId(userId: string): Promise<boolean>;
}

export const ADVISOR_REPOSITORY = Symbol('IAdvisorRepository');
