import {
  Check,
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
import { SYSTEM_TABLE_IDS } from './system-performance-tables';
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
@Check(
  'ck_system_performance_table_owner',
  `(is_default = FALSE AND tutor_id IS NOT NULL) OR
   (is_default = TRUE AND tutor_id IS NULL AND room_id IS NULL AND deleted_at IS NULL
    AND id IN ('${SYSTEM_TABLE_IDS.standard}', '${SYSTEM_TABLE_IDS.firstSession}'))`,
)
export class PerformanceTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_performance_tables_tutor_id')
  @Column({ name: 'tutor_id', type: 'uuid', nullable: true })
  tutorId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'tutor_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_performance_tables_tutor',
  })
  tutor: User | null;

  @Index('idx_performance_tables_room_id')
  @Column({ name: 'room_id', type: 'uuid', nullable: true, default: null })
  roomId: string | null;

  @Column({ name: 'source_table_id', type: 'uuid', nullable: true, default: null })
  sourceTableId: string | null;

  @Index('idx_performance_tables_source')
  @ManyToOne(() => PerformanceTable, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'source_table_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_performance_tables_source',
  })
  sourceTable?: PerformanceTable | null;

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
    assertDefaultTableCanBeUpdated(this);
    this.assertCriterionIdsAreValid(props.criteria ?? []);
    const candidate = this.buildUpdateCandidate(props);
    if (hasPastSessions) assertOnlyWeightsChanged(this, candidate);
    this.name = candidate.name;
    this.description = candidate.description;
    this.criteria = candidate.criteria;
  }

  private buildUpdateCandidate(props: UpdatePerformanceTable): PerformanceTable {
    const candidate = PerformanceTable.create({
      tutorId: this.tutorId!,
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
