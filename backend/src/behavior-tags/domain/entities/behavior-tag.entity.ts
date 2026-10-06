import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';

@Entity('behavior_tags')
@Unique('uq_behavior_tags_tutor_name', ['tutorId', 'name'])
export class BehaviorTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tutor_id', type: 'uuid', nullable: true, default: null })
  @Index('idx_behavior_tags_tutor_id')
  tutorId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'tutor_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_behavior_tags_tutor',
  })
  tutor: User | null;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  static create(props: NewBehaviorTag): BehaviorTag {
    const tag = new BehaviorTag();
    tag.tutorId = props.tutorId ?? null;
    tag.name = props.name.trim();
    tag.active = true;
    return tag;
  }

  isPredefined(): boolean {
    return this.tutorId === null;
  }

  isOwnedBy(tutorId: string): boolean {
    return this.tutorId === tutorId;
  }

  rename(name: string): void {
    this.name = name.trim();
  }

  deactivate(): void {
    this.active = false;
  }
}

export interface NewBehaviorTag {
  tutorId?: string | null;
  name: string;
}
