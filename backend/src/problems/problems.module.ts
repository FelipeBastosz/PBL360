import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/auth/auth.module';
import { RoomsModule } from '@/rooms/rooms.module';

import { CreateProblemUseCase } from './application/use-cases/create-problem.use-case';
import { Problem } from './domain/entities/problem.entity';
import { PROBLEM_REPOSITORY } from './domain/repositories/problem.repository';
import { PgProblemRepository } from './infrastructure/database/pg-problem.repository';
import { ProblemsController } from './infrastructure/http/problems.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Problem]), AuthModule, RoomsModule],
  controllers: [ProblemsController],
  providers: [
    CreateProblemUseCase,
    {
      provide: PROBLEM_REPOSITORY,
      useClass: PgProblemRepository,
    },
  ],
  exports: [PROBLEM_REPOSITORY, TypeOrmModule],
})
export class ProblemsModule {}
