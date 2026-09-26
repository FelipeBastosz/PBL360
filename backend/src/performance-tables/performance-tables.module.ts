import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceCriterion } from './domain/entities/performance-criterion.entity';
import { PerformanceTable } from './domain/entities/performance-table.entity';
import { CreatePerformanceTableUseCase } from './application/use-cases/create-performance-table.use-case';
import { PERFORMANCE_TABLE_REPOSITORY } from './domain/repositories/performance-table.repository';
import { PgPerformanceTableRepository } from './infrastructure/database/pg-performance-table.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceTable, PerformanceCriterion])],
  providers: [
    CreatePerformanceTableUseCase,
    {
      provide: PERFORMANCE_TABLE_REPOSITORY,
      useClass: PgPerformanceTableRepository,
    },
  ],
  exports: [CreatePerformanceTableUseCase],
})
export class PerformanceTablesModule {}
