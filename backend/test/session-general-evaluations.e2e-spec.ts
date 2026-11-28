import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  SESSION_GENERAL_EVALUATION_REPOSITORY,
  type SessionGeneralEvaluationRepository,
} from '@/sessions/domain/repositories/session-general-evaluation.repository';
import type { SessionGeneralEvaluationResponseDto } from '@/sessions/application/dtos/session-general-evaluation-response.dto';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser } from './helpers/fixtures';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  createDeletionFixture,
  insertDeletionFeedback,
  insertDeletionSession,
  type DeletionFixture,
} from './helpers/deletion-impact-fixtures';

describe('Session general evaluations (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let fixture: DeletionFixture;
  let coTutor: Awaited<ReturnType<typeof insertUser>>;
  let outsider: Awaited<ReturnType<typeof insertUser>>;
  let sessionId: string;

  const path = () => `/sessoes/${sessionId}/avaliacao-geral`;

  beforeAll(async () => {
    const created = await createTestApp();
    app = created.app;
    db = created.moduleRef.get(DataSource);
  }, 30000);

  beforeEach(async () => {
    await cleanDatabase(db);
    fixture = await createDeletionFixture(app, db);
    coTutor = await insertUser(app, db, 'cotutor.general@uefs.br');
    outsider = await insertUser(app, db, 'outsider.general@uefs.br');
    await db.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      fixture.roomId,
      coTutor.id,
    ]);
    sessionId = await insertDeletionSession(db, fixture.problemId);
  }, 30000);

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    try {
      if (db?.isInitialized) await cleanDatabase(db);
    } finally {
      await app?.close();
    }
  }, 30000);

  it('returns an empty list before creation and allows members to read after creation', async () => {
    await api(app, fixture.student).get(path()).expect(200, []);
    const saved = await api(app, fixture.owner)
      .put(path(), { texto: '  Debate e planejamento da turma.  ' })
      .expect(200);
    const savedBody = saved.body as SessionGeneralEvaluationResponseDto;
    expect(savedBody.texto).toBe('Debate e planejamento da turma.');
    await api(app, fixture.student).get(path()).expect(200, [savedBody]);
    await api(app, coTutor).get(path()).expect(200, [savedBody]);
  });

  it('stores and edits a separate evaluation for each tutor', async () => {
    const first = await api(app, fixture.owner)
      .put(path(), { texto: 'Registro inicial.' })
      .expect(200);
    const firstBody = first.body as SessionGeneralEvaluationResponseDto;
    const coTutorRecord = await api(app, coTutor)
      .put(path(), { texto: 'Relato da co-tutora.' })
      .expect(200);
    const coTutorBody = coTutorRecord.body as SessionGeneralEvaluationResponseDto;
    const edited = await api(app, fixture.owner)
      .put(path(), { texto: 'Registro corrigido.' })
      .expect(200);
    const editedBody = edited.body as SessionGeneralEvaluationResponseDto;
    const coTutorEdited = await api(app, coTutor)
      .put(path(), { texto: 'Relato da co-tutora corrigido.' })
      .expect(200);
    const coTutorEditedBody = coTutorEdited.body as SessionGeneralEvaluationResponseDto;

    expect(editedBody.id).toBe(firstBody.id);
    expect(editedBody.criadoEm).toBe(firstBody.criadoEm);
    expect(editedBody.texto).toBe('Registro corrigido.');
    expect(editedBody.autor.id).toBe(fixture.owner.id);
    expect(new Date(editedBody.editadoEm).getTime()).toBeGreaterThan(
      new Date(editedBody.criadoEm).getTime(),
    );
    expect(coTutorEditedBody.id).toBe(coTutorBody.id);
    expect(coTutorEditedBody.texto).toBe('Relato da co-tutora corrigido.');
    expect(coTutorEditedBody.autor.id).toBe(coTutor.id);
    const records = (await api(app, fixture.student).get(path()).expect(200))
      .body as SessionGeneralEvaluationResponseDto[];
    expect(records).toHaveLength(2);
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: editedBody.id, texto: 'Registro corrigido.' }),
        expect.objectContaining({
          id: coTutorEditedBody.id,
          texto: 'Relato da co-tutora corrigido.',
        }),
      ]),
    );
    const rows = await db.query<Array<{ created_by: string; updated_by: string }>>(
      'SELECT created_by, updated_by FROM session_general_evaluations WHERE session_id = $1 ORDER BY created_by;',
      [sessionId],
    );
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.created_by === row.updated_by)).toBe(true);
  });

  it('does not require or alter individual feedbacks and grades', async () => {
    await insertDeletionFeedback(db, fixture, sessionId);
    await api(app, fixture.owner).put(path(), { texto: 'Relato independente.' }).expect(200);
    const [counts] = await db.query<[{ feedbacks: number; evaluations: number; grades: number }]>(
      `SELECT
         (SELECT COUNT(*)::int FROM feedback WHERE sessao_id = $1) AS feedbacks,
         (SELECT COUNT(*)::int FROM evaluations WHERE session_id = $1) AS evaluations,
         (SELECT COUNT(*)::int FROM session_grades WHERE session_id = $1) AS grades;`,
      [sessionId],
    );
    expect(counts).toEqual({ feedbacks: 1, evaluations: 0, grades: 0 });
  });

  it('clears only the current tutor evaluation when empty or whitespace text is sent and is idempotent', async () => {
    await insertDeletionFeedback(db, fixture, sessionId);
    await api(app, fixture.owner).put(path(), { texto: 'Relato inicial do tutor.' }).expect(200);
    const coTutorSaved = await api(app, coTutor)
      .put(path(), { texto: 'Relato da co-tutora.' })
      .expect(200);

    const cleared = await api(app, fixture.owner).put(path(), { texto: '' }).expect(200);
    expect(cleared.text).toBe('null');

    await api(app, fixture.student).get(path()).expect(200, [coTutorSaved.body]);

    // Idempotent when clearing again with spaces only
    const idempotent = await api(app, fixture.owner).put(path(), { texto: '   ' }).expect(200);
    expect(idempotent.text).toBe('null');

    const clearedCoTutor = await api(app, coTutor).put(path(), { texto: '   ' }).expect(200);
    expect(clearedCoTutor.text).toBe('null');
    await api(app, fixture.student).get(path()).expect(200, []);

    const [counts] = await db.query<[{ feedbacks: number }]>(
      'SELECT COUNT(*)::int AS feedbacks FROM feedback WHERE sessao_id = $1;',
      [sessionId],
    );
    expect(counts.feedbacks).toBe(1);
  });

  it('rejects invalid text and session identifiers', async () => {
    for (const texto of ['x'.repeat(2001), 123]) {
      await api(app, fixture.owner).put(path(), { texto }).expect(400);
    }
    await api(app, fixture.owner).put(path(), { texto: null }).expect(400);
    await api(app, fixture.owner).put(path(), {}).expect(400);
    await api(app, fixture.owner).get('/sessoes/invalido/avaliacao-geral').expect(400);
    await api(app, fixture.owner)
      .put('/sessoes/invalido/avaliacao-geral', { texto: 'Válido.' })
      .expect(400);
  });

  it('returns 403 for users without room membership and students attempting to write', async () => {
    await api(app, outsider).get(path()).expect(403);
    await api(app, outsider).put(path(), { texto: 'Não autorizado.' }).expect(403);
    await api(app, fixture.student).put(path(), { texto: 'Aluno não pode registrar.' }).expect(403);
  });

  it('keeps a tutor evaluation accessible after that tutor leaves the room', async () => {
    const saved = await api(app, coTutor)
      .put(path(), { texto: 'Relato que permanece após a saída.' })
      .expect(200);
    await db.query('DELETE FROM room_tutors WHERE room_id = $1 AND tutor_id = $2;', [
      fixture.roomId,
      coTutor.id,
    ]);

    await api(app, fixture.student).get(path()).expect(200, [saved.body]);
    await api(app, coTutor).get(path()).expect(403);
    await api(app, coTutor).put(path(), { texto: 'Tentativa após sair.' }).expect(403);
    const [row] = await db.query<[{ count: number }]>(
      'SELECT COUNT(*)::int AS count FROM session_general_evaluations WHERE session_id = $1;',
      [sessionId],
    );
    expect(row.count).toBe(1);
  });

  it('allows a student enrolled later to read evaluations from earlier sessions', async () => {
    const saved = await api(app, fixture.owner)
      .put(path(), { texto: 'Relato anterior à matrícula.' })
      .expect(200);
    const lateStudent = await insertUser(
      app,
      db,
      'late.student@discente.uefs.br',
      UserType.STUDENT,
    );
    await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      fixture.roomId,
      lateStudent.id,
    ]);

    await api(app, lateStudent).get(path()).expect(200, [saved.body]);
  });

  it('returns 401 without authentication and 404 for an unknown session', async () => {
    await api(app).get(path()).expect(401);
    await api(app).put(path(), { texto: 'Sem autenticação.' }).expect(401);
    await api(app, fixture.owner)
      .get('/sessoes/00000000-0000-0000-0000-000000000000/avaliacao-geral')
      .expect(404);
    await api(app, fixture.owner)
      .put('/sessoes/00000000-0000-0000-0000-000000000000/avaliacao-geral', {
        texto: 'Sessão inexistente.',
      })
      .expect(404);
  });

  it('preserves the complete prior version when a save fails', async () => {
    const saved = await api(app, fixture.owner)
      .put(path(), { texto: 'Versão preservada.' })
      .expect(200);
    const savedBody = saved.body as SessionGeneralEvaluationResponseDto;
    await new Promise((resolve) => setTimeout(resolve, 5));
    jest
      .spyOn(
        app.get<SessionGeneralEvaluationRepository>(SESSION_GENERAL_EVALUATION_REPOSITORY),
        'save',
      )
      .mockRejectedValue(new Error('Falha simulada de persistência.'));

    await api(app, fixture.owner).put(path(), { texto: 'Versão que falhou.' }).expect(500);
    await api(app, fixture.student).get(path()).expect(200, [savedBody]);
  });
});
