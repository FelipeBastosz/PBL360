import { Module } from '@nestjs/common';
import { RoomsModule } from '@/rooms/rooms.module';
import { ProblemsModule } from '@/problems/problems.module';
import { GetProblemGradesUseCase } from './application/use-cases/get-problem-grades.use-case';
import { GetClassFinalReportUseCase } from './application/use-cases/get-class-final-report.use-case';
import { GRADES_REPOSITORY } from './domain/repositories/grades.repository';
import { GradesController } from './infrastructure/http/grades.controller';
import { ClassReportController } from './infrastructure/http/class-report.controller';
import { PgGradesRepository } from './infrastructure/database/pg-grades.repository';
import { GradeRecalculationNoticesController } from './infrastructure/http/grade-recalculation-notices.controller';
import { ListGradeRecalculationNoticesUseCase } from './application/use-cases/list-grade-recalculation-notices.use-case';
import { GRADE_RECALCULATION_REPOSITORY } from './domain/repositories/grade-recalculation.repository';
import { PgGradeRecalculationRepository } from './infrastructure/database/pg-grade-recalculation.repository';

@Module({
  imports: [RoomsModule, ProblemsModule],
  controllers: [GradesController, GradeRecalculationNoticesController, ClassReportController],
  providers: [
    GetProblemGradesUseCase,
    GetClassFinalReportUseCase,
    { provide: GRADES_REPOSITORY, useClass: PgGradesRepository },
    ListGradeRecalculationNoticesUseCase,
    { provide: GRADE_RECALCULATION_REPOSITORY, useClass: PgGradeRecalculationRepository },
  ],
  exports: [GetProblemGradesUseCase, GetClassFinalReportUseCase],
})
export class GradesModule {}
