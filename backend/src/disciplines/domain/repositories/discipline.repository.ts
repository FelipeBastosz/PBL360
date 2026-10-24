import type { Discipline } from '../entities/discipline.entity';

export const DISCIPLINE_REPOSITORY = Symbol('DISCIPLINE_REPOSITORY');

export interface DisciplineRepository {
  findAll(): Promise<Discipline[]>;
}
