import { SYSTEM_TABLE_IDS } from '@/performance-tables/domain/entities/system-performance-tables';
import {
  planDefaultSessionTables,
  selectDefaultTable,
  type DefaultTableSession,
} from './default-session-tables';

const session = (
  id: string,
  date: string,
  orderIndex: number,
  performanceTableId: string = SYSTEM_TABLE_IDS.standard,
): DefaultTableSession => ({
  id,
  date,
  orderIndex,
  performanceTableId,
  usesDefaultTable: true,
});

describe('Default session tables', () => {
  it('assigns the first-session table when creating the first session', () => {
    expect(selectDefaultTable([], session('first', '2026-11-10', 1))).toBe(
      SYSTEM_TABLE_IDS.firstSession,
    );
  });
  it('assigns the standard table to a later second session', () => {
    const first = session('first', '2026-11-10', 1, SYSTEM_TABLE_IDS.firstSession);
    expect(selectDefaultTable([first], session('second', '2026-11-11', 2))).toBe(
      SYSTEM_TABLE_IDS.standard,
    );
  });
  it('uses dates when a newly created session precedes the existing first session', () => {
    const first = session('first', '2026-11-10', 1, SYSTEM_TABLE_IDS.firstSession);
    const earlier = session('earlier', '2026-11-09', 2);
    expect(selectDefaultTable([first], earlier)).toBe(SYSTEM_TABLE_IDS.firstSession);
    expect(planDefaultSessionTables([first, earlier], false)).toEqual([
      { sessionId: 'first', tableId: SYSTEM_TABLE_IDS.standard },
      { sessionId: 'earlier', tableId: SYSTEM_TABLE_IDS.firstSession },
    ]);
  });
  it('reapplies both tables after changing the first-session date', () => {
    expect(
      planDefaultSessionTables(
        [
          session('first', '2026-11-12', 1, SYSTEM_TABLE_IDS.firstSession),
          session('second', '2026-11-11', 2),
        ],
        false,
      ),
    ).toHaveLength(2);
  });
  it('preserves explicit choices, including an explicitly selected system table', () => {
    const manual = { ...session('first', '2026-11-10', 1), usesDefaultTable: false };
    expect(planDefaultSessionTables([manual, session('second', '2026-11-11', 2)], false)).toEqual(
      [],
    );
  });
  it('preserves assignments when the problem has any evaluation, including drafts', () => {
    expect(planDefaultSessionTables([session('first', '2026-11-10', 1)], true)).toEqual([]);
  });
  it('uses session order to break date ties and ignores array order', () => {
    const first = session('first', '2026-11-10', 1, SYSTEM_TABLE_IDS.firstSession);
    const second = session('second', '2026-11-10', 2);
    expect(planDefaultSessionTables([second, first], false)).toEqual([]);
  });
});
