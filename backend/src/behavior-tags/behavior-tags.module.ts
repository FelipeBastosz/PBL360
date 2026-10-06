import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateBehaviorTagUseCase } from './application/use-cases/create-behavior-tag.use-case';
import { DeactivateBehaviorTagUseCase } from './application/use-cases/deactivate-behavior-tag.use-case';
import { ListBehaviorTagsUseCase } from './application/use-cases/list-behavior-tags.use-case';
import { RenameBehaviorTagUseCase } from './application/use-cases/rename-behavior-tag.use-case';
import { BehaviorTag } from './domain/entities/behavior-tag.entity';
import { BEHAVIOR_TAG_REPOSITORY } from './domain/repositories/behavior-tag.repository';
import { PgBehaviorTagRepository } from './infrastructure/database/pg-behavior-tag.repository';
import { BehaviorTagsController } from './infrastructure/http/behavior-tags.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BehaviorTag])],
  controllers: [BehaviorTagsController],
  providers: [
    ListBehaviorTagsUseCase,
    CreateBehaviorTagUseCase,
    RenameBehaviorTagUseCase,
    DeactivateBehaviorTagUseCase,
    { provide: BEHAVIOR_TAG_REPOSITORY, useClass: PgBehaviorTagRepository },
  ],
  exports: [BEHAVIOR_TAG_REPOSITORY],
})
export class BehaviorTagsModule {}
