import { Inject, Injectable } from '@nestjs/common';
import type { Discipline } from '../../domain/entities/discipline.entity';
import {
  DISCIPLINE_REPOSITORY,
  type DisciplineRepository,
} from '../../domain/repositories/discipline.repository';

@Injectable()
export class ListDisciplinesUseCase {
  constructor(
    @Inject(DISCIPLINE_REPOSITORY)
    private readonly disciplines: DisciplineRepository,
  ) {}

  execute(): Promise<Discipline[]> {
    return this.disciplines.findAll();
  }
}
