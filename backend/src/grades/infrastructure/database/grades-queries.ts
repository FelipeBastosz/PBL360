export interface GradeQuery {
  sql: string;
  params: unknown[];
}

export function buildProblemQueries(
  roomId: string,
  problemId: string,
  performanceTableId: unknown,
): GradeQuery[] {
  const subQuery = 'SELECT id FROM sessions WHERE problem_id = $1';
  return [
    ...baseQueries(roomId, problemId),
    ...gradeQueries(problemId, subQuery),
    {
      sql: 'SELECT id, weight FROM performance_criteria WHERE performance_table_id = $1 AND deleted_at IS NULL ORDER BY order_index',
      params: [performanceTableId],
    },
  ];
}

function baseQueries(roomId: string, problemId: string): GradeQuery[] {
  return [
    {
      sql: 'SELECT id, date FROM sessions WHERE problem_id = $1 ORDER BY order_index, id',
      params: [problemId],
    },
    {
      sql: `SELECT u.id, u.name, u.registration_number AS matricula FROM room_students r JOIN users u ON u.id = r.student_id WHERE r.room_id = $1 AND u.type = 'STUDENT' ORDER BY u.name, u.id`,
      params: [roomId],
    },
    {
      sql: 'SELECT id, scope, version FROM formulas WHERE problem_id = $1 AND active = true',
      params: [problemId],
    },
  ];
}

function gradeQueries(problemId: string, subQuery: string): GradeQuery[] {
  return [
    {
      sql: `SELECT session_id, student_id, criterion_id, score FROM criterion_grades WHERE session_id IN (${subQuery})`,
      params: [problemId],
    },
    {
      sql: `SELECT session_id, student_id, status FROM attendances WHERE session_id IN (${subQuery})`,
      params: [problemId],
    },
    {
      sql: `SELECT session_id, student_id, bonus_score FROM session_roles WHERE session_id IN (${subQuery})`,
      params: [problemId],
    },
  ];
}
