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

describe('Evaluation releases (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let owner: TestUser, outsider: TestUser, students: TestUser[];
  let roomId: string, problemId: string;
  const path = () => `/salas/${roomId}/problemas/${problemId}/liberacoes`;
  const future = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const insertEvaluation = async (
    type: 'SELF_ASSESSMENT' | 'PEER_ASSESSMENT',
    evaluator: TestUser,
    evaluated: TestUser,
    tableId: string,
    submitted = true,
  ) => {
    await db.query(
      `INSERT INTO evaluations (evaluator_id, student_id, problem_id, performance_table_id,
         type, status, submitted_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $1);`,
      [
        evaluator.id,
        evaluated.id,
        problemId,
        tableId,
        type,
        submitted ? 'SUBMITTED' : 'DRAFT',
        submitted ? new Date() : null,
      ],
    );
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
    roomId = room.id;
    for (const student of students) {
      await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
        roomId,
        student.id,
      ]);
    }
    const [table] = await db.query<[{ id: string }]>(
      "INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Critérios', FALSE) RETURNING id;",
      [owner.id],
    );
    const [problem] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by, performance_table_id)
       VALUES ($1, 'Problema', 1, $2, $3) RETURNING id;`,
      [roomId, owner.id, table.id],
    );
    problemId = problem.id;
    const [first, second, third] = students as [TestUser, TestUser, TestUser];
    await insertEvaluation('SELF_ASSESSMENT', first, first, table.id);
    await insertEvaluation('PEER_ASSESSMENT', first, second, table.id);
    await insertEvaluation('PEER_ASSESSMENT', first, third, table.id, false);
  });

  it('returns closed releases with student adherence', async () => {
    const response = await api(app, owner).get(path()).expect(200);

    expect(response.body as ReleasesBody).toEqual({
      autoavaliacao: { liberada: false, prazo: null, enviadas: 1, esperadas: 3 },
      pares: { liberada: false, prazo: null, enviadas: 1, esperadas: 6 },
      atualizadoEm: null,
      atualizadoPor: null,
    });
  });

  it('releases both evaluations and keeps the change', async () => {
    const deadline = future();

    const response = await api(app, owner)
      .put(path(), {
        autoavaliacao: { liberada: true, prazo: deadline },
        pares: { liberada: true, prazo: null },
      })
      .expect(200);

    const body = response.body as ReleasesBody;
    expect(body.autoavaliacao).toMatchObject({ liberada: true, prazo: deadline });
    expect(body.pares).toMatchObject({ liberada: true, prazo: null });
    expect(body.atualizadoPor).toBe(owner.id);
    expect(body.atualizadoEm).not.toBeNull();

    const stored = await api(app, owner).get(path()).expect(200);
    expect(stored.body).toEqual(body);
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

  it('forbids a tutor outside the room', async () => {
    await api(app, outsider).get(path()).expect(403);
    await api(app, outsider)
      .put(path(), { pares: { liberada: true } })
      .expect(403);
  });

  it('forbids students', async () => {
    await api(app, students[0]).get(path()).expect(403);
  });
});
