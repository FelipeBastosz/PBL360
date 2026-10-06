import type { BehaviorTag } from '../entities/behavior-tag.entity';

export const BEHAVIOR_TAG_REPOSITORY = Symbol('BEHAVIOR_TAG_REPOSITORY');

export interface BehaviorTagRepository {
  findAvailableForTutor(tutorId: string): Promise<BehaviorTag[]>;
  findById(id: string): Promise<BehaviorTag | null>;
  existsForTutorWithName(tutorId: string, name: string, ignoreId?: string): Promise<boolean>;
  save(tag: BehaviorTag): Promise<BehaviorTag>;
}
