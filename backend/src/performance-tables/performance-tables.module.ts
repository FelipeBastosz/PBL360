import { CopyPerformanceTableUseCase } from './application/use-cases/copy-performance-table.use-case';
import { PerformanceTableCopiesController } from './infrastructure/http/performance-table-copies.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsModule } from '@/rooms/rooms.module';
import { CreatePerformanceTableUseCase } from './application/use-cases/create-performance-table.use-case';
import { DeletePerformanceTableUseCase } from './application/use-cases/delete-performance-table.use-case';
import { GetPerformanceTableUseCase } from './application/use-cases/get-performance-table.use-case';
import { ListPerformanceTablesUseCase } from './application/use-cases/list-performance-tables.use-case';
import { ListRoomPerformanceTablesUseCase } from './application/use-cases/list-room-performance-tables.use-case';
import { UpdatePerformanceTableUseCase } from './application/use-cases/update-performance-table.use-case';
import { PerformanceCriterion } from './domain/entities/performance-criterion.entity';
import { PerformanceTable } from './domain/entities/performance-table.entity';
import { PERFORMANCE_TABLE_REPOSITORY } from './domain/repositories/performance-table.repository';
import { PgPerformanceTableRepository } from './infrastructure/database/pg-performance-table.repository';
import { PerformanceTablesController } from './infrastructure/http/performance-tables.controller';
import { RoomPerformanceTablesController } from './infrastructure/http/room-performance-tables.controller';
import { GetPerformanceTableUsageUseCase } from './application/use-cases/get-performance-table-usage.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceTable, PerformanceCriterion]), RoomsModule],
  controllers: [
    PerformanceTablesController,
    RoomPerformanceTablesController,
    PerformanceTableCopiesController,
  ],
  providers: [
    CopyPerformanceTableUseCase,
    CreatePerformanceTableUseCase,
    DeletePerformanceTableUseCase,
    ListPerformanceTablesUseCase,
    ListRoomPerformanceTablesUseCase,
    GetPerformanceTableUseCase,
    UpdatePerformanceTableUseCase,
    GetPerformanceTableUsageUseCase,
    {
      provide: PERFORMANCE_TABLE_REPOSITORY,
      useClass: PgPerformanceTableRepository,
    },
  ],
  exports: [
    CreatePerformanceTableUseCase,
    DeletePerformanceTableUseCase,
    ListPerformanceTablesUseCase,
    ListRoomPerformanceTablesUseCase,
    GetPerformanceTableUseCase,
    PERFORMANCE_TABLE_REPOSITORY,
  ],
})
export class PerformanceTablesModule {}
