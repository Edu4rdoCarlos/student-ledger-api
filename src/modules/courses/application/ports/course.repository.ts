import { Course } from '../../domain/entities';

export interface FindAllOptions {
  skip?: number;
  take?: number;
}

export interface FindAllResult {
  items: Course[];
  total: number;
}

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findByCode(code: string): Promise<Course | null>;
  findAll(options?: FindAllOptions): Promise<FindAllResult>;
  findByCoordinatorId(coordinatorId: string): Promise<Course[]>;
  update(course: Course): Promise<Course>;
  existsByCode(code: string): Promise<boolean>;
}

export const COURSE_REPOSITORY = Symbol('ICourseRepository');
