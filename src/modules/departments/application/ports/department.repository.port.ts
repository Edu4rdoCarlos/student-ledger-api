import { Department } from '../../domain/entities';

export interface FindAllOptions {
  skip?: number;
  take?: number;
}

export interface FindAllResult {
  items: Department[];
  total: number;
}

export interface IDepartmentRepository {
  findById(id: string): Promise<Department | null>;
  findAll(options?: FindAllOptions): Promise<FindAllResult>;
  update(department: Department): Promise<Department>;
}

export const DEPARTMENT_REPOSITORY = Symbol('DEPARTMENT_REPOSITORY');
