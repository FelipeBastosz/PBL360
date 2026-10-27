import {
  Column,
  Check,
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
import { Session } from '@/sessions/domain/entities/session.entity';
import { FormulaComponent } from './formula-component.entity';
import { InvalidProblemError } from '../errors/invalid-problem.error';

export enum FormulaScope {
  SESSAO = 'SESSAO',
  PROBLEMA = 'PROBLEMA',
}

export type NewFormula = {
  problemId?: string | null;
  sessionId?: string | null;
  scope: FormulaScope;
  version?: number;
  active?: boolean;
  isDefault?: boolean;
  createdBy: string;
  components: {
    type: string;
    referenceId?: string | null;
    weight: number;
  }[];
};

@Entity('formulas')
@Check(
  'ck_formulas_owner_scope',
  `("scope" = 'PROBLEMA' AND "problem_id" IS NOT NULL AND "session_id" IS NULL)
   OR ("scope" = 'SESSAO' AND "problem_id" IS NULL AND "session_id" IS NOT NULL)`,
)
@Index('idx_formulas_problem_scope', ['problemId', 'scope'])
@Index('idx_formulas_session_scope', ['sessionId', 'scope'])
@Index('uq_formulas_active_session', ['sessionId'], {
  unique: true,
  where: `"scope" = 'SESSAO' AND "active" = TRUE`,
})
export class Formula {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'problem_id', type: 'uuid', nullable: true })
  problemId: string | null;

  @ManyToOne(() => Problem, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'problem_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_formulas_problem',
  })
  problem: Problem | null;

  @Column({ type: 'varchar', length: 30 })
  scope: FormulaScope;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId: string | null;

  @ManyToOne(() => Session, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_formulas_session',
  })
  session: Session | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

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
    formula.problemId = props.problemId ?? null;
    formula.sessionId = props.sessionId ?? null;
    formula.scope = props.scope;
    formula.version = props.version ?? 1;
    formula.active = props.active ?? true;
    formula.isDefault = props.isDefault ?? false;
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
    this.assertOwner();
    this.assertComponents();
    this.assertWeights();
    this.components.forEach((component) => component.assertIsValid(this.scope));
  }

  private assertOwner(): void {
    if (this.scope === FormulaScope.PROBLEMA && !this.problemId) {
      throw new InvalidProblemError('A fórmula precisa estar vinculada a um problema.');
    }
    if (this.scope === FormulaScope.SESSAO && !this.sessionId) {
      throw new InvalidProblemError('A fórmula precisa estar vinculada a uma sessão.');
    }
    if (!this.createdBy) {
      throw new InvalidProblemError('O autor da fórmula é obrigatório.');
    }
  }

  private assertComponents(): void {
    if (!this.components || this.components.length === 0) {
      throw new InvalidProblemError('A fórmula precisa ter ao menos um componente.');
    }
    if (this.scope === FormulaScope.SESSAO) {
      const componentTypes = this.components.map((component) => component.type);
      if (
        componentTypes.length !== 2 ||
        new Set(componentTypes).size !== 2 ||
        !componentTypes.includes('CRITERIOS') ||
        !componentTypes.includes('PAPEL')
      ) {
        throw new InvalidProblemError(
          'A fórmula da sessão deve conter exatamente um componente CRITERIOS e um PAPEL.',
        );
      }
    }
  }

  private assertWeights(): void {
    const totalWeight = this.components.reduce((sum, c) => sum + Number(c.weight), 0);
    // Allow small rounding tolerance for 100%
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new InvalidProblemError('A soma dos pesos dos componentes deve ser exatamente 100%.');
    }
  }
}
