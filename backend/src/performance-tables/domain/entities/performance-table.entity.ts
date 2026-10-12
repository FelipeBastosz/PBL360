import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Room } from '@/rooms/domain/entities/room.entity';
import { InvalidPerformanceTableError } from '../errors/invalid-performance-table.error';
import type { NewPerformanceTable } from './new-performance-table';
import { PerformanceCriterion } from './performance-criterion.entity';
import { assertPerformanceTableIsValid } from './performance-table.validation';
import {
  assertDefaultTableCanBeUpdated,
  assertOnlyWeightsChanged,
} from './performance-table-update-policy';
import type {
  UpdatePerformanceCriterion,
  UpdatePerformanceTable,
} from './update-performance-table';

@Entity('performance_tables')
@Index('uq_performance_tables_tutor_default', ['tutorId'], {
  unique: true,
  where: '"is_default" = TRUE AND "deleted_at" IS NULL',
})
export class PerformanceTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_performance_tables_tutor_id')
  @Column({ name: 'tutor_id', type: 'uuid' })
  tutorId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'tutor_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_performance_tables_tutor',
  })
  tutor: User;

  @Index('idx_performance_tables_room_id')
  @Column({ name: 'room_id', type: 'uuid', nullable: true, default: null })
  roomId: string | null;

  @Column({ name: 'source_table_id', type: 'uuid', nullable: true, default: null })
  sourceTableId: string | null;

  @Column({ name: 'is_session_copy', type: 'boolean', default: false })
  isSessionCopy: boolean;

  @ManyToOne(() => Room, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_performance_tables_room',
  })
  room?: Room | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true, default: null })
  description: string | null;

  @Column({ name: 'is_default', type: 'boolean' })
  isDefault: boolean;

  @OneToMany(() => PerformanceCriterion, (criterion) => criterion.performanceTable, {
    cascade: ['insert'],
  })
  criteria: PerformanceCriterion[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null;

  problemCount?: number;
  sessionCount?: number;
  pastSessionCount?: number;

  static create(props: NewPerformanceTable): PerformanceTable {
    const table = new PerformanceTable();
    table.tutorId = props.tutorId?.trim();
    table.roomId = props.roomId?.trim() || null;
    table.sourceTableId = null;
    table.isSessionCopy = false;
    table.name = props.name?.trim();
    table.description = props.description?.trim() || null;
    table.isDefault = props.isDefault ?? false;
    table.criteria = (props.criteria ?? []).map((criterion, index) => {
      const entity = PerformanceCriterion.create({
        ...criterion,
        orderIndex: criterion.orderIndex ?? index + 1,
      });
      entity.performanceTable = table;
      return entity;
    });
    assertPerformanceTableIsValid(table);

    return table;
  }

  update(props: UpdatePerformanceTable, hasPastSessions = false): void {
    this.assertCriterionIdsAreValid(props.criteria ?? []);
    const candidate = this.buildUpdateCandidate(props);
    assertDefaultTableCanBeUpdated(this, candidate);
    if (hasPastSessions) assertOnlyWeightsChanged(this, candidate);
    this.name = candidate.name;
    this.description = candidate.description;
    this.criteria = candidate.criteria;
  }

  private buildUpdateCandidate(props: UpdatePerformanceTable): PerformanceTable {
    const candidate = PerformanceTable.create({
      tutorId: this.tutorId,
      roomId: this.roomId,
      name: props.name,
      description: props.description,
      criteria: props.criteria,
    });
    candidate.criteria.forEach((criterion, index) => {
      const id = props.criteria[index]!.id;
      if (id !== undefined) criterion.id = id;
      criterion.performanceTableId = this.id;
      criterion.performanceTable = this;
    });
    return candidate;
  }

  private assertCriterionIdsAreValid(criteria: UpdatePerformanceCriterion[]): void {
    const ids = criteria.flatMap((criterion) => (criterion.id === undefined ? [] : [criterion.id]));
    const currentIds = new Set(this.criteria.map((criterion) => criterion.id));
    if (new Set(ids).size !== ids.length) {
      throw new InvalidPerformanceTableError(
        'Os critérios da tabela não podem repetir o identificador.',
      );
    }
    if (ids.some((id) => !currentIds.has(id))) {
      throw new InvalidPerformanceTableError(
        'Um ou mais critérios não pertencem à configuração ativa desta tabela.',
      );
    }
  }

  delete(): void {
    if (this.deletedAt != null) {
      throw new InvalidPerformanceTableError('A tabela de desempenho já foi excluída.');
    }
    if (this.isDefault) {
      throw new InvalidPerformanceTableError(
        'A tabela de desempenho padrão não pode ser excluída.',
      );
    }
    if (this.isSessionCopy) {
      throw new InvalidPerformanceTableError(
        'As tabelas aplicadas às sessões não podem ser excluídas.',
      );
    }

    this.deletedAt = new Date();
  }
}
