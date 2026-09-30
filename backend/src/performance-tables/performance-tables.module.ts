import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceCriterion } from './domain/entities/performance-criterion.entity';
import { PerformanceTable } from './domain/entities/performance-table.entity';
import { CreatePerformanceTableUseCase } from './application/use-cases/create-performance-table.use-case';
import { DeletePerformanceTableUseCase } from './application/use-cases/delete-performance-table.use-case';
import { ListPerformanceTablesUseCase } from './application/use-cases/list-performance-tables.use-case';
import { PERFORMANCE_TABLE_REPOSITORY } from './domain/repositories/performance-table.repository';
import { PgPerformanceTableRepository } from './infrastructure/database/pg-performance-table.repository';
import { PerformanceTablesController } from './infrastructure/http/performance-tables.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceTable, PerformanceCriterion])],
  controllers: [PerformanceTablesController],
  providers: [
    CreatePerformanceTableUseCase,
    DeletePerformanceTableUseCase,
    ListPerformanceTablesUseCase,
    {
      provide: PERFORMANCE_TABLE_REPOSITORY,
      useClass: PgPerformanceTableRepository,
    },
  ],
  exports: [CreatePerformanceTableUseCase],
})
export class PerformanceTablesModule {}
