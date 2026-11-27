import { returnedRows } from './returned-rows';

describe('returnedRows', () => {
  it('accepts a direct row array', () => {
    expect(returnedRows([{ id: '1' }, { id: '2' }])).toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('unwraps the row array from a TypeORM result tuple', () => {
    expect(returnedRows([[{ id: '1' }], 1])).toEqual([{ id: '1' }]);
  });
});
