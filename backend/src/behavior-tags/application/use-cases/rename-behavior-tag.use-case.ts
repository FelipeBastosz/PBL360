import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import {
  BEHAVIOR_TAG_REPOSITORY,
  type BehaviorTagRepository,
} from '../../domain/repositories/behavior-tag.repository';

@Injectable()
export class RenameBehaviorTagUseCase {
  constructor(
    @Inject(BEHAVIOR_TAG_REPOSITORY)
    private readonly behaviorTags: BehaviorTagRepository,
  ) {}

  async execute(id: string, tutorId: string, nome: string): Promise<BehaviorTag> {
    const tag = await this.findOwnedTag(id, tutorId);
    tag.rename(nome);
    if (await this.behaviorTags.existsForTutorWithName(tutorId, tag.nome, tag.id)) {
      throw new ConflictError('Você já tem uma marcação com esse nome.');
    }

    return this.behaviorTags.save(tag);
  }

  private async findOwnedTag(id: string, tutorId: string): Promise<BehaviorTag> {
    const tag = await this.behaviorTags.findById(id);
    if (!tag?.ativa) throw new NotFoundError('Marcação não encontrada.');
    if (!tag.isOwnedBy(tutorId)) {
      throw new ForbiddenError('Só é possível alterar as suas marcações personalizadas.');
    }

    return tag;
  }
}
