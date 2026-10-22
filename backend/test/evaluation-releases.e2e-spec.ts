import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface ReleaseBody {
  liberada: boolean;
  prazo: string | null;
  enviadas: number;
  esperadas: number;
}
interface ReleasesBody {
  autoavaliacao: ReleaseBody;
  pares: ReleaseBody;
  atualizadoEm: string | null;
  atualizadoPor: string | null;
}
interface ErrorBody {
  message: string;
}

describe('Evaluation releases (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let owner: TestUser, outsider: TestUser, students: TestUser[];
  let sessionId: string, sessionWithoutRollCallId: string, problemId: string, tableId: string;
  const path = (session = sessionId) => `/sessoes/${session}/liberacoes`;
  const future = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const insertEvaluation = async (
    type: 'SELF_ASSESSMENT' | 'PEER_ASSESSMENT',
    evaluator: TestUser,
    evaluated: TestUser,
    ids: { problemId: string; tableId: string },
    submitted = true,
  ) => {
    await db.query(
      `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id,
         performance_table_id, type, status, submitted_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $1);`,
      [
        evaluator.id,
        evaluated.id,
        ids.problemId,
        sessionId,
        ids.tableId,
        type,
        submitted ? 'SUBMITTED' : 'DRAFT',
        submitted ? new Date() : null,
      ],
    );
  };

  const insertTutorEvaluation = async (student: TestUser, submitted = true) => {
    await db.query(
      `INSERT INTO session_evaluation_configs
         (session_id, performance_table_id, table_name, created_by)
       VALUES ($1, $2, 'Critérios', $3)
       ON CONFLICT (session_id) DO NOTHING;`,
      [sessionId, tableId, owner.id],
    );
    await db.query(
      `INSERT INTO evaluations
         (evaluator_id, student_id, problem_id, session_id, config_session_id,
          performance_table_id, type, status, submitted_at, session_score,
          calculation_version, created_by)
       VALUES ($1, $2, $3, $4, $4, $5, 'TUTOR_SESSION', $6, $7, $8, $9, $1);`,
      [
        owner.id,
        student.id,
        problemId,
        sessionId,
        tableId,
        submitted ? 'SUBMITTED' : 'DRAFT',
        submitted ? new Date() : null,
        submitted ? 7.5 : null,
        submitted ? 'WEIGHTED_SESSION_FORMULA_V3' : null,
      ],
    );
  };

  const seedRollCall = async () => {
    const statuses = ['PRESENT', 'LATE', 'ABSENT'];
    for (const [index, student] of students.entries()) {
      await db.query(
        `INSERT INTO attendances (session_id, student_id, recorded_by, status)
         VALUES ($1, $2, $3, $4);`,
        [sessionId, student.id, owner.id, statuses[index]],
      );
    }
  };

  beforeAll(async () => {
    const fixture = await createTestApp();
    app = fixture.app;
    db = fixture.moduleRef.get(DataSource);
  });
  afterAll(async () => {
    await cleanDatabase(db);
    await app.close();
  });
  beforeEach(async () => {
    await cleanDatabase(db);
    owner = await insertUser(app, db, 'owner@uefs.br');
    outsider = await insertUser(app, db, 'outsider@uefs.br');
    students = [
      await insertUser(app, db, 'student1@discente.uefs.br', UserType.STUDENT),
      await insertUser(app, db, 'student2@discente.uefs.br', UserType.STUDENT),
      await insertUser(app, db, 'student3@discente.uefs.br', UserType.STUDENT),
    ];
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala', 'EXA123', 'REL12345', '2026.2', true) RETURNING id;`,
      [owner.id],
    );
    for (const student of students) {
      await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
        room.id,
        student.id,
      ]);
    }
    const [table] = await db.query<[{ id: string }]>(
      "INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Critérios', FALSE) RETURNING id;",
      [owner.id],
    );
    tableId = table.id;
    const [problem] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by)
       VALUES ($1, 'Problema', 1, $2) RETURNING id;`,
      [room.id, owner.id],
    );
    problemId = problem.id;
    const sessions = await db.query<{ id: string }[]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index, status)
       VALUES ($1, $2, 'Abertura', '2026-10-05', 1, 'agendada'), ($1, $2, 'Fechamento', '2026-10-06', 2, 'agendada')
       RETURNING id;`,
      [problemId, tableId],
    );
    sessionId = sessions[0]!.id;
    sessionWithoutRollCallId = sessions[1]!.id;
    await seedRollCall();
    const [first, second] = students as [TestUser, TestUser];
    const ids = { problemId: problem.id, tableId: table.id };
    await insertEvaluation('SELF_ASSESSMENT', first, first, ids);
    await insertEvaluation('PEER_ASSESSMENT', first, second, ids);
    await insertEvaluation('PEER_ASSESSMENT', second, first, ids, false);
  }, 30000);

  it('returns closed releases with the adherence of present and late students', async () => {
    const response = await api(app, owner).get(path()).expect(200);

    expect(response.body as ReleasesBody).toEqual({
      autoavaliacao: { liberada: false, prazo: null, enviadas: 1, esperadas: 2 },
      pares: { liberada: false, prazo: null, enviadas: 1, esperadas: 2 },
      atualizadoEm: null,
      atualizadoPor: null,
    });
  });

  it('releases one evaluation and keeps the change', async () => {
    const deadline = future();

    const response = await api(app, owner)
      .put(path(), {
        autoavaliacao: { liberada: true, prazo: deadline },
        pares: { liberada: false, prazo: null },
      })
      .expect(200);

    const body = response.body as ReleasesBody;
    expect(body.autoavaliacao).toMatchObject({ liberada: true, prazo: deadline });
    expect(body.pares).toMatchObject({ liberada: false, prazo: null });
    expect(body.atualizadoPor).toBe(owner.id);
    expect(body.atualizadoEm).not.toBeNull();

    const stored = await api(app, owner).get(path()).expect(200);
    expect(stored.body).toEqual(body);
  });

  it('keeps self and peer releases mutually exclusive', async () => {
    await api(app, owner)
      .put(path(), { autoavaliacao: { liberada: true, prazo: null } })
      .expect(200);

    await api(app, owner)
      .put(path(), { pares: { liberada: true, prazo: null } })
      .expect(409);

    const response = await api(app, owner)
      .put(path(), {
        autoavaliacao: { liberada: false, prazo: null },
        pares: { liberada: true, prazo: null },
      })
      .expect(200);

    const body = response.body as ReleasesBody;
    expect(body.autoavaliacao.liberada).toBe(false);
    expect(body.pares.liberada).toBe(true);
  });

  it('turns a release off and preserves what was already submitted', async () => {
    await api(app, owner)
      .put(path(), { pares: { liberada: true } })
      .expect(200);

    const response = await api(app, owner)
      .put(path(), { pares: { liberada: false } })
      .expect(200);

    expect((response.body as ReleasesBody).pares).toMatchObject({ liberada: false, enviadas: 1 });
  });

  it('rejects a deadline in the past', async () => {
    const past = new Date(Date.now() - 60 * 1000).toISOString();

    await api(app, owner)
      .put(path(), { autoavaliacao: { liberada: true, prazo: past } })
      .expect(400);
  });

  it('rejects a body without any release', async () => {
    await api(app, owner).put(path(), {}).expect(400);
  });

  it('rejects an invalid payload', async () => {
    await api(app, owner)
      .put(path(), { pares: { liberada: 'sim', prazo: 'amanhã' } })
      .expect(400);
  });

  it('rejects a release before the roll call is saved', async () => {
    await api(app, owner)
      .put(path(sessionWithoutRollCallId), { pares: { liberada: true } })
      .expect(409);
  });

  it('forbids a tutor outside the room', async () => {
    await api(app, outsider).get(path()).expect(403);
    await api(app, outsider)
      .put(path(), { pares: { liberada: true } })
      .expect(403);
  });

  it('forbids students', async () => {
    await api(app, students[0]).get(path()).expect(403);
  });

  it('rejects releasing self evaluation when tutor already submitted evaluations', async () => {
    await insertTutorEvaluation(students[0]!, true);

    const res = await api(app, owner)
      .put(path(), { autoavaliacao: { liberada: true } })
      .expect(409);
    expect((res.body as ErrorBody).message).toBe(
      'A sessão já possui avaliações do tutor submetidas.',
    );
  });

  it('rejects releasing peer evaluation when tutor already submitted evaluations', async () => {
    await insertTutorEvaluation(students[0]!, true);

    const res = await api(app, owner)
      .put(path(), { pares: { liberada: true } })
      .expect(409);
    expect((res.body as ErrorBody).message).toBe(
      'A sessão já possui avaliações do tutor submetidas.',
    );
  });

  it('allows closing releases even when tutor already submitted evaluations', async () => {
    await insertTutorEvaluation(students[0]!, true);

    await api(app, owner)
      .put(path(), { autoavaliacao: { liberada: false }, pares: { liberada: false } })
      .expect(200);
  });

  it('allows releasing evaluations when tutor only saved draft (not submitted)', async () => {
    await insertTutorEvaluation(students[0]!, false);

    await api(app, owner)
      .put(path(), { autoavaliacao: { liberada: true } })
      .expect(200);
  });

  it('returns not found for an unknown session', async () => {
    await api(app, owner).get(path(randomUUID())).expect(404);
  });
});
