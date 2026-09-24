import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Problem } from './domain/entities/problem.entity';
import { PROBLEM_REPOSITORY } from './domain/repositories/problem.repository';
import { PgProblemRepository } from './infrastructure/database/pg-problem.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Problem])],
  providers: [
    {
      provide: PROBLEM_REPOSITORY,
      useClass: PgProblemRepository,
    },
  ],
  exports: [PROBLEM_REPOSITORY, TypeOrmModule],
})
export class ProblemsModule {}
