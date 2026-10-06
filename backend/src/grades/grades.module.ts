import { Module } from '@nestjs/common';
import { RoomsModule } from '@/rooms/rooms.module';
import { GetProblemGradesUseCase } from './application/use-cases/get-problem-grades.use-case';
import { GRADES_REPOSITORY } from './domain/repositories/grades.repository';
import { GradesController } from './infrastructure/http/grades.controller';
import { PgGradesRepository } from './infrastructure/database/pg-grades.repository';

@Module({
  imports: [RoomsModule],
  controllers: [GradesController],
  providers: [
    GetProblemGradesUseCase,
    { provide: GRADES_REPOSITORY, useClass: PgGradesRepository },
  ],
})
export class GradesModule {}
