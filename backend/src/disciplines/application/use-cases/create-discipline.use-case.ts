import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '@/shared/errors/application.error';
import { Discipline, type NewDiscipline } from '../../domain/entities/discipline.entity';
import {
  DISCIPLINE_REPOSITORY,
  type DisciplineRepository,
} from '../../domain/repositories/discipline.repository';

@Injectable()
export class CreateDisciplineUseCase {
  constructor(
    @Inject(DISCIPLINE_REPOSITORY)
    private readonly disciplines: DisciplineRepository,
  ) {}

  async execute(input: NewDiscipline): Promise<Discipline> {
    const discipline = Discipline.create(input);
    const created = await this.disciplines.create(discipline);
    if (!created) {
      throw new ConflictError(`Já existe uma disciplina com o código ${discipline.code}.`);
    }

    return created;
  }
}
