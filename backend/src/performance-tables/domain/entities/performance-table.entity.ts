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
import { assertOnlyWeightsChanged } from './performance-table-update-policy';
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
    table.assertIsValid();

    return table;
  }

  update(props: UpdatePerformanceTable, hasPastSessions = false): void {
    this.assertCriterionIdsAreValid(props.criteria ?? []);
    const candidate = PerformanceTable.create({
      tutorId: this.tutorId,
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

    this.assertDefaultTableCanBeUpdated(candidate);
    if (hasPastSessions) assertOnlyWeightsChanged(this, candidate);
    this.name = candidate.name;
    this.description = candidate.description;
    this.criteria = candidate.criteria;
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

    this.deletedAt = new Date();
  }

  private assertDefaultTableCanBeUpdated(candidate: PerformanceTable): void {
    if (!this.isDefault) return;

    if (candidate.name !== this.name || candidate.description !== this.description) {
      throw new InvalidPerformanceTableError(
        'O nome e a descrição da tabela padrão não podem ser alterados.',
      );
    }

    this.assertDefaultCriteriaUnchanged(candidate);
  }

  private assertDefaultCriteriaUnchanged(candidate: PerformanceTable): void {
    const currentCriteria = new Map(this.criteria.map((criterion) => [criterion.id, criterion]));
    if (
      candidate.criteria.length !== this.criteria.length ||
      candidate.criteria.some((criterion) => {
        const current = currentCriteria.get(criterion.id);
        return (
          !current ||
          criterion.name !== current.name ||
          criterion.description !== current.description ||
          criterion.orderIndex !== current.orderIndex
        );
      })
    ) {
      throw new InvalidPerformanceTableError(
        'Os nomes, descrições e ordens dos critérios da tabela padrão não podem ser alterados.',
      );
    }
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
    this.assertCriteriaWeightsSumToTen();
  }

  private criteriaHaveUniqueOrderIndexes(): void {
    const orderIndexes = this.criteria.map((criterion) => criterion.orderIndex);
    if (new Set(orderIndexes).size !== orderIndexes.length) {
      throw new InvalidPerformanceTableError(
        'Os critérios da tabela de desempenho não podem repetir a ordem.',
      );
    }
  }

  private assertCriteriaWeightsSumToTen(): void {
    const totalWeight = this.criteria.reduce(
      (sum, criterion) => sum + Number(criterion.weight ?? 0),
      0,
    );

    if (Number.isNaN(totalWeight) || Math.abs(totalWeight - 10) > 0.0001) {
      throw new InvalidPerformanceTableError('A soma dos pesos dos critérios deve ser igual a 10.');
    }
  }
}
