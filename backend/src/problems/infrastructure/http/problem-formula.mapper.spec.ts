import { FormulaScope } from '../../domain/entities/formula.entity';
import { toCustomizeFormulaComponents, toFormulaResponse } from './problem-formula.mapper';

describe('toFormulaResponse', () => {
  it('translates the formula to the Portuguese contract', () => {
    const response = toFormulaResponse({
      scope: FormulaScope.SESSAO,
      isDefault: false,
      version: 2,
      components: [{ type: 'CRITERIO', referenceId: 'crit-1', name: 'Domínio', weight: 100 }],
    });

    expect(response).toEqual({
      escopo: FormulaScope.SESSAO,
      padrao: false,
      versao: 2,
      componentes: [{ tipo: 'CRITERIO', referenciaId: 'crit-1', nome: 'Domínio', peso: 100 }],
    });
  });
});

describe('toCustomizeFormulaComponents', () => {
  it('translates the Portuguese payload components to the use case input', () => {
    const components = toCustomizeFormulaComponents({
      escopo: FormulaScope.SESSAO,
      componentes: [{ tipo: 'CRITERIO', referenciaId: 'criterion-1', peso: 2 }],
    });

    expect(components).toEqual([{ type: 'CRITERIO', referenceId: 'criterion-1', weight: 2 }]);
  });
});
