import {
  FIND_PERFORMANCE_TABLE_BY_ID_INCLUDING_DELETED_QUERY,
  FIND_PERFORMANCE_TABLE_BY_ID_QUERY,
  FIND_PERFORMANCE_TABLE_USAGE_QUERY,
  FIND_ROOM_PERFORMANCE_TABLES_QUERY,
  INSERT_PERFORMANCE_TABLE_QUERY,
  PERFORMANCE_TABLE_SUMMARY_QUERY,
  UPDATE_PERFORMANCE_TABLE_QUERY,
} from './performance-table.queries';

describe('performance table SQL contracts', () => {
  it('summarizes active owned or default tables without session copies', () => {
    expect(PERFORMANCE_TABLE_SUMMARY_QUERY).toContain(
      'performance_tables.tutor_id = $1 OR performance_tables.is_default = TRUE',
    );
    expect(PERFORMANCE_TABLE_SUMMARY_QUERY).toContain('performance_tables.is_session_copy = FALSE');
    expect(PERFORMANCE_TABLE_SUMMARY_QUERY).toContain('performance_tables.deleted_at IS NULL');
  });

  it('reads criteria in display order and can explicitly include a deleted table', () => {
    expect(FIND_PERFORMANCE_TABLE_BY_ID_QUERY).toContain('pt.deleted_at IS NULL');
    expect(FIND_PERFORMANCE_TABLE_BY_ID_QUERY).toContain('pc.order_index ASC');
    expect(FIND_PERFORMANCE_TABLE_BY_ID_INCLUDING_DELETED_QUERY).not.toContain(
      'pt.deleted_at IS NULL',
    );
  });

  it('updates and inserts tables and computes past-session usage', () => {
    expect(UPDATE_PERFORMANCE_TABLE_QUERY).toContain('AND deleted_at IS NULL');
    expect(INSERT_PERFORMANCE_TABLE_QUERY).toContain('RETURNING');
    expect(FIND_PERFORMANCE_TABLE_USAGE_QUERY).toContain('pastSessionCount');
    expect(FIND_PERFORMANCE_TABLE_USAGE_QUERY).toContain("e.status = 'SUBMITTED'");
    expect(FIND_ROOM_PERFORMANCE_TABLES_QUERY).toContain('copy.source_table_id = pt.id');
  });
});
