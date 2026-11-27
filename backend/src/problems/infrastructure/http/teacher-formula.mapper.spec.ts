import { toTeacherFormulaResponse } from './teacher-formula.mapper';

describe('toTeacherFormulaResponse', () => {
  it('maps a formula and omits an absent id', () => {
    expect(
      toTeacherFormulaResponse({
        scope: 'PROBLEM',
        isDefault: true,
        version: 2,
        components: [
          { type: 'CRITERIA', weight: 70 },
          { type: 'ROLE', weight: 30 },
        ],
      } as never),
    ).toEqual({
      escopo: 'PROBLEM',
      padrao: true,
      versao: 2,
      componentes: [
        { tipo: 'CRITERIA', peso: 70 },
        { tipo: 'ROLE', peso: 30 },
      ],
    });
  });

  it('includes a formula id when present', () => {
    expect(
      toTeacherFormulaResponse({
        id: 'f1',
        scope: 'SESSION',
        isDefault: false,
        version: 1,
        components: [],
      } as never),
    ).toMatchObject({ id: 'f1', componentes: [] });
  });
});
