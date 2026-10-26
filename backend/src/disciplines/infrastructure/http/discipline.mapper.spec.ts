import { Discipline } from '../../domain/entities/discipline.entity';
import { toDisciplineResponse } from './discipline.mapper';

describe('toDisciplineResponse', () => {
  it('exposes the discipline with the Portuguese contract fields', () => {
    const discipline = Object.assign(new Discipline(), {
      id: 'd-1',
      code: 'TEC502',
      name: 'MI Concorrência e Conectividade',
    });

    expect(toDisciplineResponse(discipline)).toEqual({
      id: 'd-1',
      codigo: 'TEC502',
      nome: 'MI Concorrência e Conectividade',
    });
  });
});
