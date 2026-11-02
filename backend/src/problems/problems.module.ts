import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomsModule } from '@/rooms/rooms.module';
import { PerformanceTablesModule } from '@/performance-tables/performance-tables.module';

import { CreateProblemUseCase } from './application/use-cases/create-problem.use-case';
import { DeleteProblemUseCase } from './application/use-cases/delete-problem.use-case';
import { GetProblemDeletionImpactUseCase } from './application/use-cases/get-problem-deletion-impact.use-case';
import { GetProblemUseCase } from './application/use-cases/get-problem.use-case';
import { ListProblemsByRoomUseCase } from './application/use-cases/list-problems-by-room.use-case';
import { UpdateProblemUseCase } from './application/use-cases/update-problem.use-case';
import { GetProblemFormulaUseCase } from './application/use-cases/get-problem-formula.use-case';
import { CustomizeProblemFormulaUseCase } from './application/use-cases/customize-problem-formula.use-case';
import { RestoreDefaultFormulaUseCase } from './application/use-cases/restore-default-formula.use-case';
import { FinalGradeFormulaUseCase } from './application/use-cases/final-grade-formula.use-case';
import { GetTeacherFormulaUseCase } from './application/use-cases/get-teacher-formula.use-case';
import { UpdateTeacherFormulaUseCase } from './application/use-cases/update-teacher-formula.use-case';
import { Problem } from './domain/entities/problem.entity';
import { Formula } from './domain/entities/formula.entity';
import { FormulaComponent } from './domain/entities/formula-component.entity';
import { PROBLEM_REPOSITORY } from './domain/repositories/problem.repository';
import { FORMULA_REPOSITORY } from './domain/repositories/formula.repository';
import { PgProblemRepository } from './infrastructure/database/pg-problem.repository';
import { PgFormulaRepository } from './infrastructure/database/pg-formula.repository';
import { ProblemsController } from './infrastructure/http/problems.controller';
import { ProblemFormulasController } from './infrastructure/http/problem-formulas.controller';
import { FinalGradeFormulaController } from './infrastructure/http/final-grade-formula.controller';
import { TeacherFormulasController } from './infrastructure/http/teacher-formulas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Problem, Formula, FormulaComponent]),
    RoomsModule,
    PerformanceTablesModule,
  ],
  controllers: [
    ProblemsController,
    ProblemFormulasController,
    FinalGradeFormulaController,
    TeacherFormulasController,
  ],
  providers: [
    CreateProblemUseCase,
    GetProblemUseCase,
    ListProblemsByRoomUseCase,
    UpdateProblemUseCase,
    GetProblemDeletionImpactUseCase,
    DeleteProblemUseCase,
    GetProblemFormulaUseCase,
    CustomizeProblemFormulaUseCase,
    RestoreDefaultFormulaUseCase,
    FinalGradeFormulaUseCase,
    GetTeacherFormulaUseCase,
    UpdateTeacherFormulaUseCase,
    {
      provide: PROBLEM_REPOSITORY,
      useClass: PgProblemRepository,
    },
    {
      provide: FORMULA_REPOSITORY,
      useClass: PgFormulaRepository,
    },
  ],
  exports: [PROBLEM_REPOSITORY, FORMULA_REPOSITORY],
})
export class ProblemsModule {}
