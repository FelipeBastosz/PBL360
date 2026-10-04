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
@Unique('uq_behavior_tags_tutor_nome', ['tutorId', 'nome'])
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
  nome: string;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  static create(props: NewBehaviorTag): BehaviorTag {
    const tag = new BehaviorTag();
    tag.tutorId = props.tutorId ?? null;
    tag.nome = props.nome.trim();
    tag.ativa = true;
    return tag;
  }

  isPredefined(): boolean {
    return this.tutorId === null;
  }

  deactivate(): void {
    this.ativa = false;
  }
}

export interface NewBehaviorTag {
  tutorId?: string | null;
  nome: string;
}
