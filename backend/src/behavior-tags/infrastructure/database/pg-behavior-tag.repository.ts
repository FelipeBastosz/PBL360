import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import type { BehaviorTagRepository } from '../../domain/repositories/behavior-tag.repository';

@Injectable()
export class PgBehaviorTagRepository implements BehaviorTagRepository {
  constructor(
    @InjectRepository(BehaviorTag)
    private readonly tags: Repository<BehaviorTag>,
  ) {}

  findAvailableForTutor(tutorId: string): Promise<BehaviorTag[]> {
    return this.tags.find({
      where: [
        { tutorId: IsNull(), active: true },
        { tutorId, active: true },
      ],
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<BehaviorTag | null> {
    return this.tags.findOneBy({ id });
  }

  existsForTutorWithName(tutorId: string, name: string, ignoreId?: string): Promise<boolean> {
    return this.tags.existsBy({
      tutorId,
      name,
      ...(ignoreId ? { id: Not(ignoreId) } : {}),
    });
  }

  save(tag: BehaviorTag): Promise<BehaviorTag> {
    return this.tags.save(tag);
  }
}
