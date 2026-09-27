import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomsModule } from '@/rooms/rooms.module';

import { CreateProblemUseCase } from './application/use-cases/create-problem.use-case';
import { GetProblemUseCase } from './application/use-cases/get-problem.use-case';
import { ListProblemsByRoomUseCase } from './application/use-cases/list-problems-by-room.use-case';
import { UpdateProblemUseCase } from './application/use-cases/update-problem.use-case';
import { Problem } from './domain/entities/problem.entity';
import { PROBLEM_REPOSITORY } from './domain/repositories/problem.repository';
import { PgProblemRepository } from './infrastructure/database/pg-problem.repository';
import { ProblemsController } from './infrastructure/http/problems.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Problem]), RoomsModule],
  controllers: [ProblemsController],
  providers: [
    CreateProblemUseCase,
    GetProblemUseCase,
    ListProblemsByRoomUseCase,
    UpdateProblemUseCase,
    {
      provide: PROBLEM_REPOSITORY,
      useClass: PgProblemRepository,
    },
  ],
  exports: [PROBLEM_REPOSITORY],
})
export class ProblemsModule {}
