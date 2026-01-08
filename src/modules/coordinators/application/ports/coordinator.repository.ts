import { Coordinator } from '../../domain/entities';

export const COORDINATOR_REPOSITORY = 'COORDINATOR_REPOSITORY';

export interface ICoordinatorRepository {
  create(coordinator: Coordinator): Promise<Coordinator>;
  findById(id: string): Promise<Coordinator | null>;
  findByUserId(userId: string): Promise<Coordinator | null>;
  findByCourseId(courseId: string): Promise<Coordinator | null>;
  existsByUserId(userId: string): Promise<boolean>;
  update(coordinator: Coordinator): Promise<Coordinator>;
  findAll(): Promise<Coordinator[]>;
}
