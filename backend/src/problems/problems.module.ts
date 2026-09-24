import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Problem } from './domain/entities/problem.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Problem])],
  exports: [TypeOrmModule],
})
export class ProblemsModule {}
