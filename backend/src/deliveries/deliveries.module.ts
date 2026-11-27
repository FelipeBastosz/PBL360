import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemsModule } from '@/problems/problems.module';
import { RoomsModule } from '@/rooms/rooms.module';
import { ListProblemDeliveriesUseCase } from './application/use-cases/list-problem-deliveries.use-case';
import { RegisterProblemDeliveryUseCase } from './application/use-cases/register-problem-delivery.use-case';
import { ProblemDelivery } from './domain/entities/problem-delivery.entity';
import { PROBLEM_DELIVERY_REPOSITORY } from './domain/repositories/problem-delivery.repository';
import { PgProblemDeliveryRepository } from './infrastructure/database/pg-problem-delivery.repository';
import { ProblemDeliveriesController } from './infrastructure/http/problem-deliveries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProblemDelivery]), RoomsModule, ProblemsModule],
  controllers: [ProblemDeliveriesController],
  providers: [
    RegisterProblemDeliveryUseCase,
    ListProblemDeliveriesUseCase,
    {
      provide: PROBLEM_DELIVERY_REPOSITORY,
      useClass: PgProblemDeliveryRepository,
    },
  ],
  exports: [PROBLEM_DELIVERY_REPOSITORY],
})
export class DeliveriesModule {}
