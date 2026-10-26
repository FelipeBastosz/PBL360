import { createSheetNamer } from './xlsx-sheet-name';

describe('createSheetNamer', () => {
  it('keeps a valid title as the sheet name', () => {
    expect(createSheetNamer()('Notas da sessão', 1)).toBe('Notas da sessão');
  });

  it('removes characters Excel does not accept in sheet names', () => {
    expect(createSheetNamer()("'Notas: [turma] A/B*?'", 1)).toBe('Notas turma A B');
  });

  it('limits the name to 31 characters', () => {
    expect(createSheetNamer()('Feedbacks individuais da sessão de fechamento', 1)).toHaveLength(31);
  });

  it('numbers repeated names, ignoring case, without passing the limit', () => {
    const sheetName = createSheetNamer();
    const longTitle = 'Feedbacks individuais da sessão de fechamento';

    expect(sheetName('Notas', 1)).toBe('Notas');
    expect(sheetName('NOTAS', 2)).toBe('NOTAS (2)');
    expect(sheetName(longTitle, 3)).toHaveLength(31);
    expect(sheetName(longTitle, 4)).toMatch(/ \(2\)$/);
    expect(sheetName(longTitle, 4)).toHaveLength(31);
  });

  it('uses the section position when the title has nothing usable', () => {
    expect(createSheetNamer()('[]:*?', 3)).toBe('Seção 3');
  });
});
