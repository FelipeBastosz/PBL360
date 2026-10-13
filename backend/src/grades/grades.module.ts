import { Module } from '@nestjs/common';
import { RoomsModule } from '@/rooms/rooms.module';
import { GetProblemGradesUseCase } from './application/use-cases/get-problem-grades.use-case';
import { GRADES_REPOSITORY } from './domain/repositories/grades.repository';
import { GradesController } from './infrastructure/http/grades.controller';
import { PgGradesRepository } from './infrastructure/database/pg-grades.repository';
import { GradeRecalculationNoticesController } from './infrastructure/http/grade-recalculation-notices.controller';
import { ListGradeRecalculationNoticesUseCase } from './application/use-cases/list-grade-recalculation-notices.use-case';
import { GRADE_RECALCULATION_REPOSITORY } from './domain/repositories/grade-recalculation.repository';
import { PgGradeRecalculationRepository } from './infrastructure/database/pg-grade-recalculation.repository';

@Module({
  imports: [RoomsModule],
  controllers: [GradesController, GradeRecalculationNoticesController],
  providers: [
    GetProblemGradesUseCase,
    { provide: GRADES_REPOSITORY, useClass: PgGradesRepository },
    ListGradeRecalculationNoticesUseCase,
    { provide: GRADE_RECALCULATION_REPOSITORY, useClass: PgGradeRecalculationRepository },
  ],
})
export class GradesModule {}
