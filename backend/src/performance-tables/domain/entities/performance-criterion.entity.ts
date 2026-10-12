import {
  Column,
  Check,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvalidPerformanceTableError } from '../errors/invalid-performance-table.error';
import type { NewPerformanceCriterion } from './new-performance-table';
import { PerformanceTable } from './performance-table.entity';

@Entity('performance_criteria')
@Index('uq_performance_criteria_table_order_active', ['performanceTableId', 'orderIndex'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check('chk_performance_criteria_weight', '"weight" >= 0 AND "weight" <= 10')
export class PerformanceCriterion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_performance_criteria_table_id')
  @Column({ name: 'performance_table_id', type: 'uuid' })
  performanceTableId: string;

  @Column({ name: 'source_criterion_id', type: 'uuid', nullable: true, default: null })
  sourceCriterionId: string | null;

  @ManyToOne(() => PerformanceTable, (table) => table.criteria, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'performance_table_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_performance_criteria_table',
  })
  performanceTable: PerformanceTable;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true, default: null })
  description: string | null;

  @Column({ name: 'order_index', type: 'smallint', default: 1 })
  orderIndex: number;

  @Column({ name: 'weight', type: 'numeric', precision: 4, scale: 2, default: 1 })
  weight: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null;

  static create(props: NewPerformanceCriterion): PerformanceCriterion {
    const criterion = new PerformanceCriterion();
    criterion.name = props.name?.trim();
    criterion.description = props.description?.trim() || null;
    criterion.orderIndex = props.orderIndex ?? 1;
    criterion.weight = props.weight ?? 1;
    criterion.assertIsValid();

    return criterion;
  }

  private assertIsValid(): void {
    this.assertNameIsValid();
    this.assertNumbersAreValid();
  }

  private assertNameIsValid(): void {
    if (!this.name) {
      throw new InvalidPerformanceTableError('O nome do critério é obrigatório.');
    }

    if (this.name.length > 120) {
      throw new InvalidPerformanceTableError(
        'O nome do critério deve ter no máximo 120 caracteres.',
      );
    }
  }

  private assertNumbersAreValid(): void {
    if (!Number.isInteger(this.orderIndex) || this.orderIndex < 1) {
      throw new InvalidPerformanceTableError('A ordem do critério deve ser um inteiro positivo.');
    }

    if (this.weight < 0 || this.weight > 10) {
      throw new InvalidPerformanceTableError('O peso do critério deve estar entre 0 e 10.');
    }
  }
}
