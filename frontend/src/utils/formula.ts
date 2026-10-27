import type { FormulaComponent, FormulaComponentType, FormulaScope } from '@/types/formula';

type ProblemComponentType = Exclude<FormulaComponentType, 'CRITERIO'>;

export const PROBLEM_COMPONENT_NAMES: Record<ProblemComponentType, string> = {
  MEDIA_SESSOES: 'Média das Sessões',
};

export type TableCriterion = { id: string; nome: string };

export const SCOPE_TABS: Array<{ scope: FormulaScope; label: string }> = [
  { scope: 'SESSAO', label: 'Nota de Sessão' },
  { scope: 'PROBLEMA', label: 'Nota Final' },
];

export const componentKey = (component: FormulaComponent) =>
  component.referenciaId ?? component.tipo;

export function componentName(component: FormulaComponent): string {
  if (component.nome) return component.nome;
  return component.tipo === 'CRITERIO'
    ? 'Critério'
    : PROBLEM_COMPONENT_NAMES[component.tipo as ProblemComponentType];
}

export function totalWeight(components: FormulaComponent[]): number {
  const sum = components.reduce((total, component) => total + component.peso, 0);
  return Math.round(sum * 100) / 100;
}

// The API accepts a 0.01 rounding tolerance around 100%.
export function isBalanced(components: FormulaComponent[]): boolean {
  return Math.abs(totalWeight(components) - 100) <= 0.01;
}

export function formatWeight(value: number): string {
  return `${(Math.round(value * 100) / 100).toLocaleString('pt-BR')}%`;
}

// Components the tutor can still add: table criteria for sessions, fixed parts for the problem.
export function missingComponents(
  scope: FormulaScope,
  current: FormulaComponent[],
  criteria: TableCriterion[],
): FormulaComponent[] {
  const used = new Set(current.map(componentKey));
  const candidates: FormulaComponent[] =
    scope === 'SESSAO'
      ? criteria.map(({ id, nome }) => ({ tipo: 'CRITERIO', referenciaId: id, nome, peso: 0 }))
      : Object.entries(PROBLEM_COMPONENT_NAMES).map(([tipo, nome]) => ({
          tipo: tipo as ProblemComponentType,
          referenciaId: null,
          nome,
          peso: 0,
        }));
  return candidates.filter((candidate) => !used.has(componentKey(candidate)));
}
