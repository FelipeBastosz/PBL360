import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import {
  BEHAVIOR_TAG_REPOSITORY,
  type BehaviorTagRepository,
} from '../../domain/repositories/behavior-tag.repository';

export interface DeactivateBehaviorTagInput {
  id: string;
  tutorId: string;
}

@Injectable()
export class DeactivateBehaviorTagUseCase {
  constructor(
    @Inject(BEHAVIOR_TAG_REPOSITORY)
    private readonly behaviorTags: BehaviorTagRepository,
  ) {}

  async execute({ id, tutorId }: DeactivateBehaviorTagInput): Promise<void> {
    const tag = await this.behaviorTags.findById(id);
    if (!tag?.active) throw new NotFoundError('Marcação não encontrada.');
    if (!tag.isOwnedBy(tutorId)) {
      throw new ForbiddenError('Só é possível excluir as suas marcações personalizadas.');
    }

    tag.deactivate();
    await this.behaviorTags.save(tag);
  }
}
