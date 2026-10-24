import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListDisciplinesUseCase } from './application/use-cases/list-disciplines.use-case';
import { Discipline } from './domain/entities/discipline.entity';
import { DISCIPLINE_REPOSITORY } from './domain/repositories/discipline.repository';
import { PgDisciplineRepository } from './infrastructure/database/pg-discipline.repository';
import { DisciplinesController } from './infrastructure/http/disciplines.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Discipline])],
  controllers: [DisciplinesController],
  providers: [
    ListDisciplinesUseCase,
    { provide: DISCIPLINE_REPOSITORY, useClass: PgDisciplineRepository },
  ],
})
export class DisciplinesModule {}
