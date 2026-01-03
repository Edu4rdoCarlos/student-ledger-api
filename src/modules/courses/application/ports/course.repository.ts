import { Course } from '../../domain/entities';

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findByCodigo(codigo: string): Promise<Course | null>;
  findByOrganizationId(organizationId: string): Promise<Course[]>;
  findAll(): Promise<Course[]>;
  update(course: Course): Promise<Course>;
  existsByCodigo(codigo: string): Promise<boolean>;
}

export const COURSE_REPOSITORY = Symbol('ICourseRepository');
