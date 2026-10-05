import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsModule } from '@/sessions/sessions.module';
import { ComplementObservationUseCase } from './application/use-cases/complement-observation.use-case';
import { ListStudentObservationsUseCase } from './application/use-cases/list-student-observations.use-case';
import { RegisterObservationUseCase } from './application/use-cases/register-observation.use-case';
import { UndoObservationUseCase } from './application/use-cases/undo-observation.use-case';
import { Observation } from './domain/entities/observation.entity';
import { OBSERVATION_REPOSITORY } from './domain/repositories/observation.repository';
import { PgObservationRepository } from './infrastructure/database/pg-observation.repository';
import { ObservationsController } from './infrastructure/http/observations.controller';
import { StudentObservationsController } from './infrastructure/http/student-observations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Observation]), SessionsModule],
  controllers: [StudentObservationsController, ObservationsController],
  providers: [
    RegisterObservationUseCase,
    ComplementObservationUseCase,
    UndoObservationUseCase,
    ListStudentObservationsUseCase,
    { provide: OBSERVATION_REPOSITORY, useClass: PgObservationRepository },
  ],
})
export class ObservationsModule {}
