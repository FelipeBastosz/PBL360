import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Formula, FormulaScope } from './formula.entity';
import { InvalidProblemError } from '../errors/invalid-problem.error';

export enum FormulaComponentType {
  CRITERIOS = 'CRITERIOS',
  PAPEL = 'PAPEL',
  CRITERIO = 'CRITERIO',
  SESSAO = 'SESSAO',
  MEDIA_SESSOES = 'MEDIA_SESSOES',
  AUTOAVALIACAO = 'AUTOAVALIACAO',
  PARES = 'PARES',
}

@Entity('formula_components')
export class FormulaComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'formula_id', type: 'uuid' })
  formulaId: string;

  @ManyToOne(() => Formula, (formula) => formula.components, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'formula_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_formula_components_formula',
  })
  formula: Formula;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true, default: null })
  referenceId: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  weight: number;

  assertIsValid(scope: FormulaScope): void {
    if (
      scope === FormulaScope.PROBLEMA &&
      (this.type as FormulaComponentType) === FormulaComponentType.SESSAO
    ) {
      if (this.weight <= 0 || this.weight > 10 || !this.referenceId) {
        throw new InvalidProblemError('O peso da sessão deve ser maior que zero e no máximo 10.');
      }
      return;
    }
    if (this.weight < 0 || this.weight > 100) {
      throw new InvalidProblemError('O peso de um componente deve estar entre 0 e 100.');
    }
    if (scope === FormulaScope.SESSAO) {
      this.assertSessionScope();
    } else {
      this.assertProblemScope();
    }
  }

  private assertSessionScope(): void {
    const type = this.type as FormulaComponentType;
    if (type !== FormulaComponentType.CRITERIOS && type !== FormulaComponentType.PAPEL) {
      throw new InvalidProblemError(
        'Fórmulas de sessão só podem conter componentes CRITERIOS ou PAPEL.',
      );
    }
    if (this.referenceId) {
      throw new InvalidProblemError('Os componentes da fórmula da sessão não usam referência.');
    }
  }

  private assertProblemScope(): void {
    const validProblemTypes = [FormulaComponentType.SESSAO, FormulaComponentType.MEDIA_SESSOES];
    if (!validProblemTypes.includes(this.type as FormulaComponentType)) {
      throw new InvalidProblemError(
        'Componente inválido para a fórmula da nota final do problema.',
      );
    }
    if (this.referenceId && (this.type as FormulaComponentType) !== FormulaComponentType.SESSAO) {
      throw new InvalidProblemError(
        'Componentes da nota final do problema não utilizam referência de critério.',
      );
    }
  }
}
