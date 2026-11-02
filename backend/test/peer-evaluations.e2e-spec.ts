import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface PeerSummaryItem {
  alunoId: string;
  nome: string;
  iniciais: string;
  status: 'PENDENTE' | 'RASCUNHO' | 'ENVIADA';
}

interface PeerListResponse {
  liberada: boolean;
  prazo: string | null;
  colegas: PeerSummaryItem[];
}

interface PeerDetailResponse {
  colega: { alunoId: string; nome: string };
  status: 'PENDENTE' | 'RASCUNHO' | 'ENVIADA';
  enviadaEm: string | null;
  criterios: Array<{ id: string; nome: string; peso: number; notaMaxima: number }>;
  itens: Array<{ criterioId: string; nota: number }>;
}

describe('Peer evaluations (e2e)', () => {
  const hookTimeoutMs = 30_000;
  let app: INestApplication;
  let db: DataSource;
  let owner: TestUser,
    evaluatorStudent: TestUser,
    peerPresentStudent: TestUser,
    peerLateStudent: TestUser,
    peerAbsentStudent: TestUser,
    outsiderStudent: TestUser;
  let roomId: string, problemId: string, sessionId: string, tableId: string;
  let crit1Id: string, crit2Id: string;

  const peersListPath = (sess = sessionId) => `/sessoes/${sess}/pares`;
  const peerDetailPath = (colegaId: string, sess = sessionId) =>
    `/sessoes/${sess}/pares/${colegaId}`;

  beforeAll(async () => {
    const fixture = await createTestApp();
    app = fixture.app;
    db = fixture.moduleRef.get(DataSource);
  }, hookTimeoutMs);

  afterAll(async () => {
    await cleanDatabase(db);
    await app.close();
  }, hookTimeoutMs);

  beforeEach(async () => {
    await cleanDatabase(db);
    owner = await insertUser(app, db, 'tutor@uefs.br', UserType.TUTOR);
    evaluatorStudent = await insertUser(app, db, 'evaluator@discente.uefs.br', UserType.STUDENT);
    peerPresentStudent = await insertUser(app, db, 'present@discente.uefs.br', UserType.STUDENT);
    peerLateStudent = await insertUser(app, db, 'late@discente.uefs.br', UserType.STUDENT);
    peerAbsentStudent = await insertUser(app, db, 'absent@discente.uefs.br', UserType.STUDENT);
    outsiderStudent = await insertUser(app, db, 'outsider@discente.uefs.br', UserType.STUDENT);

    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala Teste', 'EXA123', 'PEER1234', '2026.2', true) RETURNING id;`,
      [owner.id],
    );
    roomId = room.id;

    for (const student of [
      evaluatorStudent,
      peerPresentStudent,
      peerLateStudent,
      peerAbsentStudent,
    ]) {
      await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
        roomId,
        student.id,
      ]);
    }

    const [table] = await db.query<[{ id: string }]>(
      "INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Tabela Barema', FALSE) RETURNING id;",
      [owner.id],
    );
    tableId = table.id;

    const criteria = await db.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Participação', 1, 1), ($1, 'Autonomia', 2, 3) RETURNING id;`,
      [tableId],
    );
    crit1Id = criteria[0]!.id;
    crit2Id = criteria[1]!.id;

    const [problem] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by)
       VALUES ($1, 'Problema 1', 1, $2) RETURNING id;`,
      [roomId, owner.id],
    );
    problemId = problem.id;

    const [session] = await db.query<{ id: string }[]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index, status, peer_eval_released)
       VALUES ($1, $2, 'Sessão 1', '2026-10-05', 1, 'agendada', true) RETURNING id;`,
      [problemId, tableId],
    );
    sessionId = session.id;

    // Seed attendances:
    // evaluator: PRESENT
    // peerPresent: PRESENT
    // peerLate: LATE
    // peerAbsent: ABSENT
    await db.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $4, 'PRESENT'),
              ($1, $3, $4, 'PRESENT'),
              ($1, $5, $4, 'LATE'),
              ($1, $6, $4, 'ABSENT');`,
      [
        sessionId,
        evaluatorStudent.id,
        peerPresentStudent.id,
        owner.id,
        peerLateStudent.id,
        peerAbsentStudent.id,
      ],
    );
  }, hookTimeoutMs);

  describe('GET /sessoes/:sessaoId/pares', () => {
    it('returns the list of participating peers with PENDENTE status', async () => {
      const response = await api(app, evaluatorStudent).get(peersListPath()).expect(200);
      const body = response.body as PeerListResponse;

      expect(body.liberada).toBe(true);
      expect(body.prazo).toBeNull();
      // Should include peerPresent and peerLate, but NOT peerAbsent, and NOT evaluator themselves
      expect(body.colegas).toHaveLength(2);
      expect(body.colegas.map((c) => c.alunoId)).toEqual(
        expect.arrayContaining([peerPresentStudent.id, peerLateStudent.id]),
      );
      expect(body.colegas.find((c) => c.alunoId === peerAbsentStudent.id)).toBeUndefined();
      expect(body.colegas.find((c) => c.alunoId === evaluatorStudent.id)).toBeUndefined();

      body.colegas.forEach((c) => {
        expect(c.status).toBe('PENDENTE');
        expect(c.iniciais).toBeDefined();
      });
    });

    it('returns empty colleagues list if evaluator student did not participate (was absent)', async () => {
      const response = await api(app, peerAbsentStudent).get(peersListPath()).expect(200);
      const body = response.body as PeerListResponse;

      expect(body.colegas).toEqual([]);
    });

    it('forbids students not enrolled in the room', async () => {
      await api(app, outsiderStudent).get(peersListPath()).expect(403);
    });

    it('forbids tutors from accessing student peer evaluation listing', async () => {
      await api(app, owner).get(peersListPath()).expect(403);
    });
  });

  describe('GET /sessoes/:sessaoId/pares/:colegaId', () => {
    it('returns 422 when student attempts to evaluate himself (autoavaliação disfarçada de par)', async () => {
      const response = await api(app, evaluatorStudent)
        .get(peerDetailPath(evaluatorStudent.id))
        .expect(422);

      expect((response.body as { message: string }).message).toContain(
        'Um aluno não pode avaliar a si mesmo como par',
      );
    });

    it('returns 422 when colleague was absent in the session (colega ausente na sessão)', async () => {
      const response = await api(app, evaluatorStudent)
        .get(peerDetailPath(peerAbsentStudent.id))
        .expect(422);

      expect((response.body as { message: string }).message).toContain(
        'O colega não participou da sessão',
      );
    });

    it('returns 423 when evaluating student did not participate in the session', async () => {
      const response = await api(app, peerAbsentStudent)
        .get(peerDetailPath(peerPresentStudent.id))
        .expect(423);

      expect((response.body as { message: string }).message).toContain(
        'Apenas alunos que participaram da sessão podem avaliar colegas',
      );
    });

    it('returns 200 with form criteria and empty items when pending', async () => {
      const response = await api(app, evaluatorStudent)
        .get(peerDetailPath(peerPresentStudent.id))
        .expect(200);

      const body = response.body as PeerDetailResponse;
      expect(body.colega.alunoId).toBe(peerPresentStudent.id);
      expect(body.status).toBe('PENDENTE');
      expect(body.enviadaEm).toBeNull();
      expect(body.criterios).toHaveLength(2);
      expect(body.criterios).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: crit1Id, peso: 1, notaMaxima: 10 }),
          expect.objectContaining({ id: crit2Id, peso: 3, notaMaxima: 10 }),
        ]),
      );
      expect(body.itens).toEqual([]);
    });
  });

  describe('PUT /sessoes/:sessaoId/pares/:colegaId', () => {
    it('returns 422 on self-evaluation attempt (autoavaliação disfarçada de par)', async () => {
      await api(app, evaluatorStudent)
        .put(peerDetailPath(evaluatorStudent.id), {
          itens: [{ criterioId: crit1Id, nota: 10 }],
          enviar: false,
        })
        .expect(422);
    });

    it('returns 400 when colleague was absent in the session (colega ausente na sessão)', async () => {
      const response = await api(app, evaluatorStudent)
        .put(peerDetailPath(peerAbsentStudent.id), {
          itens: [{ criterioId: crit1Id, nota: 8 }],
          enviar: false,
        })
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 400,
          message: 'Não é possível avaliar um aluno que não esteve presente nesta sessão.',
        }),
      );
    });

    it('returns 423 when peer evaluation is not released (liberação desligada)', async () => {
      await db.query('UPDATE sessions SET peer_eval_released = false WHERE id = $1;', [sessionId]);

      const response = await api(app, evaluatorStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [{ criterioId: crit1Id, nota: 8 }],
          enviar: false,
        })
        .expect(423);

      expect((response.body as { message: string }).message).toContain(
        'A avaliação entre pares não está liberada',
      );
    });

    it('returns 423 when deadline has passed (prazo vencido)', async () => {
      await db.query(
        "UPDATE sessions SET peer_eval_deadline = now() - interval '1 hour' WHERE id = $1;",
        [sessionId],
      );

      const response = await api(app, evaluatorStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [{ criterioId: crit1Id, nota: 8 }],
          enviar: false,
        })
        .expect(423);

      expect((response.body as { message: string }).message).toContain(
        'O prazo para avaliação entre pares expirou',
      );
    });

    it('returns 423 when evaluator was absent in the session (avaliador que não participou)', async () => {
      const response = await api(app, peerAbsentStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [{ criterioId: crit1Id, nota: 8 }],
          enviar: false,
        })
        .expect(423);

      expect((response.body as { message: string }).message).toContain(
        'Apenas alunos que participaram da sessão podem avaliar colegas',
      );
    });

    it('returns 423 and does not persist submission before roll call is recorded', async () => {
      await db.query('DELETE FROM attendances WHERE session_id = $1;', [sessionId]);

      const response = await api(app, evaluatorStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [
            { criterioId: crit1Id, nota: 8 },
            { criterioId: crit2Id, nota: 10 },
          ],
          enviar: true,
        })
        .expect(423);

      expect((response.body as { message: string }).message).toContain(
        'A chamada da sessão ainda não foi realizada pelo professor',
      );

      const evaluations = await db.query<Array<{ id: string }>>(
        `SELECT id FROM evaluations
         WHERE session_id = $1 AND evaluator_id = $2 AND student_id = $3
           AND type = 'PEER_ASSESSMENT';`,
        [sessionId, evaluatorStudent.id, peerPresentStudent.id],
      );
      expect(evaluations).toHaveLength(0);
    });

    it('returns 422 when criterion is not in performance table', async () => {
      const fakeCriterion = '11111111-1111-4111-8111-111111111111';
      const response = await api(app, evaluatorStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [{ criterioId: fakeCriterion, nota: 8 }],
          enviar: false,
        })
        .expect(422);

      expect((response.body as { message: string }).message).toContain(
        'Um dos critérios não pertence à configuração desta avaliação',
      );
    });

    it('returns 422 when score is out of bounds (< 0 or > 10)', async () => {
      const response = await api(app, evaluatorStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [{ criterioId: crit1Id, nota: 11 }],
          enviar: false,
        })
        .expect(422);

      expect((response.body as { message: string }).message).toContain(
        'A nota do critério deve estar entre 0 e 10',
      );
    });

    it('returns 422 when submitting with incomplete criteria', async () => {
      const response = await api(app, evaluatorStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [{ criterioId: crit1Id, nota: 8 }],
          enviar: true,
        })
        .expect(422);

      expect((response.body as { message: string }).message).toContain(
        'Preencha todos os critérios antes de enviar a avaliação',
      );
    });

    it('saves draft successfully and updates peer list status to RASCUNHO', async () => {
      const saveResponse = await api(app, evaluatorStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [{ criterioId: crit1Id, nota: 7 }],
          enviar: false,
        })
        .expect(200);

      const detail = saveResponse.body as PeerDetailResponse;
      expect(detail.status).toBe('RASCUNHO');
      expect(detail.enviadaEm).toBeNull();
      expect(detail.itens).toEqual([{ criterioId: crit1Id, nota: 7 }]);

      // Check peer list status
      const listResponse = await api(app, evaluatorStudent).get(peersListPath()).expect(200);
      const list = listResponse.body as PeerListResponse;
      const peerItem = list.colegas.find((c) => c.alunoId === peerPresentStudent.id);
      expect(peerItem?.status).toBe('RASCUNHO');
    });

    it('submits evaluation successfully, calculates consolidated score, and locks further changes (409)', async () => {
      // Submit evaluation: crit1 (weight 1, score 8), crit2 (weight 3, score 10)
      // Consolidated score = (8*1 + 10*3) / 4 = 38 / 4 = 9.5
      const submitResponse = await api(app, evaluatorStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [
            { criterioId: crit1Id, nota: 8 },
            { criterioId: crit2Id, nota: 10 },
          ],
          enviar: true,
        })
        .expect(200);

      const detail = submitResponse.body as PeerDetailResponse;
      expect(detail.status).toBe('ENVIADA');
      expect(detail.enviadaEm).not.toBeNull();
      expect(detail.itens).toEqual(
        expect.arrayContaining([
          { criterioId: crit1Id, nota: 8 },
          { criterioId: crit2Id, nota: 10 },
        ]),
      );

      // Verify in DB that consolidated score is 9.5 and type is PEER_ASSESSMENT
      const [evalRow] = await db.query<
        Array<{ session_score: string; status: string; applied_bonus: string | null }>
      >(
        `SELECT session_score, status, applied_bonus FROM evaluations
          WHERE session_id = $1 AND evaluator_id = $2 AND student_id = $3 AND type = 'PEER_ASSESSMENT';`,
        [sessionId, evaluatorStudent.id, peerPresentStudent.id],
      );
      expect(Number(evalRow.session_score)).toBe(9.5);
      expect(evalRow.status).toBe('SUBMITTED');
      expect(evalRow.applied_bonus).toBeNull();

      // Attempting to modify submitted evaluation returns 409 Conflict
      await api(app, evaluatorStudent)
        .put(peerDetailPath(peerPresentStudent.id), {
          itens: [
            { criterioId: crit1Id, nota: 9 },
            { criterioId: crit2Id, nota: 9 },
          ],
          enviar: false,
        })
        .expect(409);

      // Check peer list status is now ENVIADA
      const listResponse = await api(app, evaluatorStudent).get(peersListPath()).expect(200);
      const list = listResponse.body as PeerListResponse;
      const peerItem = list.colegas.find((c) => c.alunoId === peerPresentStudent.id);
      expect(peerItem?.status).toBe('ENVIADA');
    });

    it('enforces database check constraint preventing evaluator equal to student', async () => {
      await expect(
        db.query(
          `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id, performance_table_id, type, created_by)
           VALUES ($1, $1, $2, $3, $4, 'PEER_ASSESSMENT', $1);`,
          [evaluatorStudent.id, problemId, sessionId, tableId],
        ),
      ).rejects.toThrow();
    });

    it('preserves student privacy: student does not see evaluations received from peers', async () => {
      // peerPresent evaluates evaluatorStudent
      await api(app, peerPresentStudent)
        .put(peerDetailPath(evaluatorStudent.id), {
          itens: [
            { criterioId: crit1Id, nota: 5 },
            { criterioId: crit2Id, nota: 6 },
          ],
          enviar: true,
        })
        .expect(200);

      // evaluatorStudent fetches peers list: only shows peers TO evaluate, does NOT show evaluations RECEIVED
      const listResponse = await api(app, evaluatorStudent).get(peersListPath()).expect(200);
      const list = listResponse.body as PeerListResponse;
      // evaluatorStudent's own evaluation of peerPresent is still PENDENTE
      const peerPresentInList = list.colegas.find((c) => c.alunoId === peerPresentStudent.id);
      expect(peerPresentInList?.status).toBe('PENDENTE');
      expect(list.colegas.find((c) => c.alunoId === evaluatorStudent.id)).toBeUndefined();
    });
  });

  describe('Swagger documentation', () => {
    it('documents all peer evaluation routes, request payloads and response schemas', async () => {
      const response = await api(app).get('/docs/json').expect(200);
      const doc = response.body as OpenAPIObject;

      const listPath = '/api/sessoes/{sessaoId}/pares';
      const detailPath = '/api/sessoes/{sessaoId}/pares/{colegaId}';

      expect(doc.paths[listPath]?.get).toBeDefined();
      expect(doc.paths[listPath]?.get?.responses['200']).toBeDefined();

      expect(doc.paths[detailPath]?.get).toBeDefined();
      expect(doc.paths[detailPath]?.get?.responses['200']).toBeDefined();
      expect(doc.paths[detailPath]?.get?.responses['422']).toBeDefined();

      expect(doc.paths[detailPath]?.put).toBeDefined();
      expect(doc.paths[detailPath]?.put?.responses['200']).toBeDefined();
      expect(doc.paths[detailPath]?.put?.responses['409']).toBeDefined();
      expect(doc.paths[detailPath]?.put?.responses['422']).toBeDefined();
      expect(doc.paths[detailPath]?.put?.responses['423']).toBeDefined();

      expect(doc.components?.schemas?.SavePeerEvaluationDto).toBeDefined();
      expect(doc.components?.schemas?.SessionPeersResponseDto).toBeDefined();
      expect(doc.components?.schemas?.PeerEvaluationResponseDto).toBeDefined();
    });
  });
});
