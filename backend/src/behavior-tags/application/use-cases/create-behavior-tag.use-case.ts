import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '@/shared/errors/application.error';
import { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import {
  BEHAVIOR_TAG_REPOSITORY,
  type BehaviorTagRepository,
} from '../../domain/repositories/behavior-tag.repository';

@Injectable()
export class CreateBehaviorTagUseCase {
  constructor(
    @Inject(BEHAVIOR_TAG_REPOSITORY)
    private readonly behaviorTags: BehaviorTagRepository,
  ) {}

  async execute(tutorId: string, name: string): Promise<BehaviorTag> {
    const tag = BehaviorTag.create({ tutorId, name });
    if (await this.behaviorTags.existsForTutorWithName(tutorId, tag.name)) {
      throw new ConflictError('Você já tem uma marcação com esse nome.');
    }

    return this.behaviorTags.save(tag);
  }
}
