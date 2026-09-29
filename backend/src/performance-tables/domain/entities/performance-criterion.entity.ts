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
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { CriterionCategory } from '../enums/criterion-category.enum';
import { InvalidPerformanceTableError } from '../errors/invalid-performance-table.error';
import type { NewPerformanceCriterion } from './new-performance-table';
import { PerformanceTable } from './performance-table.entity';

@Entity('performance_criteria')
@Unique('uq_performance_criteria_table_order', ['performanceTableId', 'orderIndex'])
@Check('chk_performance_criteria_weight', '"weight" >= 0 AND "weight" <= 10')
@Check('chk_performance_criteria_max_score', '"max_score" > 0')
export class PerformanceCriterion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_performance_criteria_table_id')
  @Column({ name: 'performance_table_id', type: 'uuid' })
  performanceTableId: string;

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

  @Column({
    type: 'enum',
    enum: CriterionCategory,
    enumName: 'performance_criterion_category',
    default: CriterionCategory.CONTENT,
  })
  category: CriterionCategory;

  @Column({ name: 'order_index', type: 'smallint', default: 1 })
  orderIndex: number;

  @Column({ name: 'weight', type: 'numeric', precision: 4, scale: 2, default: 1 })
  weight: number;

  @Column({ name: 'max_score', type: 'numeric', precision: 5, scale: 2, default: 10 })
  maxScore: number;

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
    criterion.category = props.category ?? CriterionCategory.CONTENT;
    criterion.orderIndex = props.orderIndex ?? 1;
    criterion.weight = props.weight ?? 1;
    criterion.maxScore = props.maxScore ?? 10;
    criterion.assertIsValid();

    return criterion;
  }

  private assertIsValid(): void {
    this.assertNameIsValid();
    this.assertCategoryIsValid();
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

  private assertCategoryIsValid(): void {
    if (!Object.values(CriterionCategory).includes(this.category)) {
      throw new InvalidPerformanceTableError(
        'A categoria do critério deve ser CONTENT, PARTICIPATION ou BEHAVIOR.',
      );
    }
  }

  private assertNumbersAreValid(): void {
    if (!Number.isInteger(this.orderIndex) || this.orderIndex < 1) {
      throw new InvalidPerformanceTableError('A ordem do critério deve ser um inteiro positivo.');
    }

    if (!(this.maxScore > 0)) {
      throw new InvalidPerformanceTableError('A nota máxima do critério deve ser maior que zero.');
    }

    if (this.weight <= 0 || this.weight >= 10) {
      throw new InvalidPerformanceTableError('O peso do critério deve estar entre 0 e 10.');
    }
  }
}
