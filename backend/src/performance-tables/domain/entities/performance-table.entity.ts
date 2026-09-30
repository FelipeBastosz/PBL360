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
import { InvalidPerformanceTableError } from '../errors/invalid-performance-table.error';
import type { NewPerformanceTable } from './new-performance-table';
import { PerformanceCriterion } from './performance-criterion.entity';

@Entity('performance_tables')
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

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true, default: null })
  description: string | null;

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

  static create(props: NewPerformanceTable): PerformanceTable {
    const table = new PerformanceTable();
    table.tutorId = props.tutorId?.trim();
    table.name = props.name?.trim();
    table.description = props.description?.trim() || null;
    table.criteria = (props.criteria ?? []).map((criterion, index) => {
      const entity = PerformanceCriterion.create({
        ...criterion,
        orderIndex: criterion.orderIndex ?? index + 1,
      });
      entity.performanceTable = table;
      return entity;
    });
    table.assertIsValid();

    return table;
  }

  delete(): void {
    if (this.deletedAt != null) {
      throw new InvalidPerformanceTableError('A tabela de desempenho já foi excluída.');
    }

    this.deletedAt = new Date();
  }

  private assertIsValid(): void {
    if (!this.tutorId) {
      throw new InvalidPerformanceTableError('O professor responsável é obrigatório.');
    }

    if (!this.name) {
      throw new InvalidPerformanceTableError('O nome da tabela de desempenho é obrigatório.');
    }

    if (this.name.length > 120) {
      throw new InvalidPerformanceTableError(
        'O nome da tabela de desempenho deve ter no máximo 120 caracteres.',
      );
    }

    if (this.criteria.length === 0) {
      throw new InvalidPerformanceTableError(
        'A tabela de desempenho deve possuir ao menos um critério.',
      );
    }

    this.criteriaHaveUniqueOrderIndexes();
  }

  private criteriaHaveUniqueOrderIndexes(): void {
    const orderIndexes = this.criteria.map((criterion) => criterion.orderIndex);
    if (new Set(orderIndexes).size !== orderIndexes.length) {
      throw new InvalidPerformanceTableError(
        'Os critérios da tabela de desempenho não podem repetir a ordem.',
      );
    }
  }
}
