import { Discipline } from './discipline.entity';

describe('Discipline', () => {
  it('normalizes the code to upper case and trims the name', () => {
    const discipline = Discipline.create({ code: ' exa999 ', name: '  MI Nova Disciplina ' });

    expect(discipline.code).toBe('EXA999');
    expect(discipline.name).toBe('MI Nova Disciplina');
  });
});
