import { Student } from '../../domain/entities';

export interface IStudentRepository {
  create(student: Student): Promise<Student>;
  findById(id: string): Promise<Student | null>;
  findByMatricula(matricula: string): Promise<Student | null>;
  findByUserId(userId: string): Promise<Student | null>;
  findByCourseId(courseId: string): Promise<Student[]>;
  findAll(): Promise<Student[]>;
  update(student: Student): Promise<Student>;
  delete(id: string): Promise<void>;
  existsByMatricula(matricula: string): Promise<boolean>;
  existsByUserId(userId: string): Promise<boolean>;
}

export const STUDENT_REPOSITORY = Symbol('IStudentRepository');
