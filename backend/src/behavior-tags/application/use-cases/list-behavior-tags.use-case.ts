import { Inject, Injectable } from '@nestjs/common';
import type { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import {
  BEHAVIOR_TAG_REPOSITORY,
  type BehaviorTagRepository,
} from '../../domain/repositories/behavior-tag.repository';

@Injectable()
export class ListBehaviorTagsUseCase {
  constructor(
    @Inject(BEHAVIOR_TAG_REPOSITORY)
    private readonly behaviorTags: BehaviorTagRepository,
  ) {}

  execute(tutorId: string): Promise<BehaviorTag[]> {
    return this.behaviorTags.findAvailableForTutor(tutorId);
  }
}
