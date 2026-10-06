import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Problem } from './problem.entity';
import { FormulaComponent } from './formula-component.entity';
import { InvalidProblemError } from '../errors/invalid-problem.error';

export enum FormulaScope {
  SESSAO = 'SESSAO',
  PROBLEMA = 'PROBLEMA',
}

export type NewFormula = {
  problemId: string;
  scope: FormulaScope;
  version?: number;
  active?: boolean;
  createdBy: string;
  components: {
    type: string;
    referenceId?: string | null;
    weight: number;
  }[];
};

@Entity('formulas')
@Index('idx_formulas_problem_scope', ['problemId', 'scope'])
export class Formula {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'problem_id', type: 'uuid' })
  problemId: string;

  @ManyToOne(() => Problem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'problem_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_formulas_problem',
  })
  problem: Problem;

  @Column({ type: 'varchar', length: 30 })
  scope: FormulaScope;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => FormulaComponent, (component) => component.formula, {
    cascade: ['insert'],
  })
  components: FormulaComponent[];

  @Index('idx_formulas_created_by')
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'created_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_formulas_created_by',
  })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  static create(props: NewFormula): Formula {
    const formula = new Formula();
    formula.problemId = props.problemId;
    formula.scope = props.scope;
    formula.version = props.version ?? 1;
    formula.active = props.active ?? true;
    formula.createdBy = props.createdBy;

    formula.components = props.components.map((c) => {
      const comp = new FormulaComponent();
      comp.type = c.type;
      comp.referenceId = c.referenceId ?? null;
      comp.weight = c.weight;
      return comp;
    });

    formula.assertIsValid();
    return formula;
  }

  private assertIsValid(): void {
    if (!this.problemId) {
      throw new InvalidProblemError('A fórmula precisa estar vinculada a um problema.');
    }
    if (!this.createdBy) {
      throw new InvalidProblemError('O autor da fórmula é obrigatório.');
    }
    if (!this.components || this.components.length === 0) {
      throw new InvalidProblemError('A fórmula precisa ter ao menos um componente.');
    }

    const totalWeight = this.components.reduce((sum, c) => sum + Number(c.weight), 0);
    // Allow small rounding tolerance for 100%
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new InvalidProblemError('A soma dos pesos dos componentes deve ser exatamente 100%.');
    }

    this.components.forEach((c) => c.assertIsValid(this.scope));
  }
}
