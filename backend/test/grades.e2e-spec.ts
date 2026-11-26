import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { acceptCurrentTermForAllUsers, cleanDatabase, signAccessToken } from './helpers/fixtures';

interface ComponentBody {
  nota: number | null;
  situacao: string;
}

interface GradesResponseBody {
  sessoes: Array<{ id: string; rotulo: string; data: string }>;
  alunos: Array<{
    alunoId: string;
    nome: string;
    matricula: string | null;
    sessoes: Array<{
      sessaoId: string;
      nota: number | null;
      situacao: string;
      autoavaliacao: ComponentBody;
      pares: ComponentBody;
    }>;
    notaFinal: number | null;
    autoavaliacao: ComponentBody;
    pares: ComponentBody;
  }>;
  mediaTurma: number | null;
  versoesFormula: { sessao: number | null; problema: number | null };
}

describe('Grades (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let tutorId: string;
  let coTutorId: string;
  let otherTutorId: string;
  let studentId: string;
  let roomId: string;
  let problemId: string;
  let sessionId: string;
  let criterionId: string;
  let performanceTableId: string;
  let tutorToken: string;
  let coTutorToken: string;
  let otherTutorToken: string;
  let studentToken: string;

  const server = () => request(app.getHttpServer() as Server);
  const gradesPath = () => `/api/salas/${roomId}/problemas/${problemId}/notas`;
  const performancePath = () => `/api/salas/${roomId}/alunos/${studentId}/desempenho`;

  beforeAll(async () => {
    let moduleRef: TestingModule;
    ({ app, moduleRef } = await createTestApp());
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);

    const [tutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Carlos Professor', 'carlos.grades@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    tutorId = tutor.id;

    const [coTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Maria Co-tutora', 'maria.grades@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    coTutorId = coTutor.id;

    const [otherTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('João Outro', 'joao.grades@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    otherTutorId = otherTutor.id;

    const [student] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users
        (name, email, password_hash, type, registration_number, active)
       VALUES ('Ana Discente', 'ana.grades@discente.uefs.br', 'hash', $1, '20260001', true)
       RETURNING id;`,
      [UserType.STUDENT],
    );
    studentId = student.id;

    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Engenharia de Software', 'EXA123', 'GRADES01', '2026.2', true)
       RETURNING id;`,
      [tutorId],
    );
    roomId = room.id;

    await dataSource.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      roomId,
      coTutorId,
    ]);

    await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      studentId,
    ]);

    const [performanceTable] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default)
       VALUES ($1, 'Tabela de notas', false)
       RETURNING id;`,
      [tutorId],
    );

    const [criterion] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_criteria
        (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Participação', 1, 1)
       RETURNING id;`,
      [performanceTable.id],
    );
    criterionId = criterion.id;
    performanceTableId = performanceTable.id;

    const [problem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems
        (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema de notas', 'Problema para teste de notas', 1, $2)
       RETURNING id;`,
      [roomId, tutorId],
    );
    problemId = problem.id;

    const [session] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions
        (problem_id, performance_table_id, title, description, date, order_index)
       VALUES ($1, $2, 'Sessão de avaliação', 'Sessão de teste', '2026-10-02', 1)
       RETURNING id;`,
      [problemId, performanceTable.id],
    );
    sessionId = session.id;

    await dataSource.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
       VALUES ($1, $2, $3, 8.5);`,
      [sessionId, studentId, criterionId],
    );

    await acceptCurrentTermForAllUsers(dataSource);

    tutorToken = signAccessToken(app, tutorId, 'carlos.grades@uefs.br', UserType.TUTOR);
    coTutorToken = signAccessToken(app, coTutorId, 'maria.grades@uefs.br', UserType.TUTOR);
    otherTutorToken = signAccessToken(app, otherTutorId, 'joao.grades@uefs.br', UserType.TUTOR);
    studentToken = signAccessToken(app, studentId, 'ana.grades@discente.uefs.br', UserType.STUDENT);
  });

  it('returns calculated grades, attendance and mark counts in session date order', async () => {
    await dataSource.query(
      'UPDATE criterion_grades SET score = 0 WHERE session_id = $1 AND student_id = $2;',
      [sessionId, studentId],
    );
    await dataSource.query(
      `INSERT INTO sessions
        (problem_id, performance_table_id, title, description, date, order_index)
       VALUES ($1, $2, 'Sessão pendente', 'Sem nota', '2026-10-01', 2);`,
      [problemId, performanceTableId],
    );
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'PRESENT');`,
      [sessionId, studentId, tutorId],
    );
    const [tag] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO behavior_tags (tutor_id, name) VALUES ($1, 'Colaboração') RETURNING id;`,
      [tutorId],
    );
    const [otherStudent] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users
        (name, email, password_hash, type, registration_number, active)
       VALUES ('Bruno Discente', 'bruno.grades@discente.uefs.br', 'hash', $1, '20260002', true)
       RETURNING id;`,
      [UserType.STUDENT],
    );
    await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      otherStudent.id,
    ]);
    for (let index = 0; index < 2; index += 1) {
      const [observation] = await dataSource.query<[{ id: string }]>(
        `INSERT INTO observations (session_id, student_id, author_id, text)
         VALUES ($1, $2, $3, 'Registro') RETURNING id;`,
        [sessionId, studentId, tutorId],
      );
      await dataSource.query(
        'INSERT INTO observation_tags (observation_id, tag_id) VALUES ($1, $2);',
        [observation.id, tag.id],
      );
    }
    const [otherObservation] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO observations (session_id, student_id, author_id, text)
       VALUES ($1, $2, $3, 'Outro aluno') RETURNING id;`,
      [sessionId, otherStudent.id, tutorId],
    );
    await dataSource.query(
      'INSERT INTO observation_tags (observation_id, tag_id) VALUES ($1, $2);',
      [otherObservation.id, tag.id],
    );

    const response = await server()
      .get(performancePath())
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    const responseBody = JSON.parse(response.text) as unknown;
    const body = responseBody as {
      sala: { id: string; nome: string };
      aluno: { id: string; nome: string };
      sessoes: Array<Record<string, unknown>>;
    };

    expect(body.sala).toEqual({ id: roomId, nome: 'Engenharia de Software' });
    expect(body.aluno).toEqual({ id: studentId, nome: 'Ana Discente' });
    expect(body.sessoes).toHaveLength(2);
    expect(body.sessoes[0]).toMatchObject({
      rotulo: 'Sessão pendente',
      data: '01-10-2026',
      nota: null,
      situacao: 'PENDENTE',
      presenca: null,
      marcacoes: [],
    });
    expect(body.sessoes[1]).toMatchObject({
      sessaoId: sessionId,
      problemaId: problemId,
      problemaTitulo: 'Problema de notas',
      rotulo: 'Sessão de avaliação',
      data: '02-10-2026',
      nota: 0,
      situacao: 'AVALIADA',
      modalidade: 'TUTOR',
      presenca: 'PRESENTE',
      marcacoes: [{ id: tag.id, nome: 'Colaboração', quantidade: 2 }],
    });
  });

  it('allows the active co-tutor and restricts removed co-tutors, external tutors and students', async () => {
    await server()
      .get(`${performancePath()}?problemaId=${problemId}`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .expect(200);

    await dataSource.query('DELETE FROM room_tutors WHERE room_id = $1 AND tutor_id = $2;', [
      roomId,
      coTutorId,
    ]);
    await server()
      .get(performancePath())
      .set('Authorization', `Bearer ${coTutorToken}`)
      .expect(403);
    await server()
      .get(performancePath())
      .set('Authorization', `Bearer ${otherTutorToken}`)
      .expect(403);
    await server()
      .get(performancePath())
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
    await server().get(performancePath()).expect(401);
  });

  it('validates path/query UUIDs and returns 404 for unlinked or nonexistent room, student or problem', async () => {
    const [otherRoom] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Outra Turma', 'EXA999', 'OTHER999', '2026.2', true)
       RETURNING id;`,
      [otherTutorId],
    );
    const [otherRoomProblem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema externo', 'De outra sala', 1, $2)
       RETURNING id;`,
      [otherRoom.id, otherTutorId],
    );
    const [otherRoomStudent] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Davi Externo', 'davi.grades@discente.uefs.br', 'hash', $1, '20260099', true)
       RETURNING id;`,
      [UserType.STUDENT],
    );
    await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      otherRoom.id,
      otherRoomStudent.id,
    ]);

    await server()
      .get(`/api/salas/invalido/alunos/${studentId}/desempenho`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(400);
    await server()
      .get(`/api/salas/${roomId}/alunos/invalido/desempenho`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(400);
    await server()
      .get(`${performancePath()}?problemaId=invalido`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(400);
    await server()
      .get(`${performancePath()}?problemaId=`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(400);
    await server()
      .get(`/api/salas/00000000-0000-4000-8000-000000000000/alunos/${studentId}/desempenho`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(404);
    await server()
      .get(`${performancePath()}?problemaId=00000000-0000-4000-8000-000000000000`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(404);
    await server()
      .get(`${performancePath()}?problemaId=${otherRoomProblem.id}`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(404);
    await server()
      .get(`/api/salas/${roomId}/alunos/00000000-0000-4000-8000-000000000000/desempenho`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(404);
    await server()
      .get(`/api/salas/${roomId}/alunos/${otherRoomStudent.id}/desempenho`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(404);
  });

  it('returns an empty session list when the problem has no sessions or the room has no problems', async () => {
    await dataSource.query('DELETE FROM sessions WHERE id = $1;', [sessionId]);

    const emptyProblemRes = await server()
      .get(`${performancePath()}?problemaId=${problemId}`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);

    expect(emptyProblemRes.body).toMatchObject({
      sala: { id: roomId },
      aluno: { id: studentId },
      sessoes: [],
    });

    await dataSource.query('DELETE FROM problems WHERE id = $1;', [problemId]);

    const emptyRoomRes = await server()
      .get(performancePath())
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);

    expect(emptyRoomRes.body).toMatchObject({
      sala: { id: roomId },
      aluno: { id: studentId },
      sessoes: [],
    });
  });

  it('orders same-date sessions by problem and session order indexes and filters by problemaId', async () => {
    const [secondSession] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions
        (problem_id, performance_table_id, title, description, date, order_index)
       VALUES ($1, $2, 'Sessão 2 P1', 'Segunda do P1', '2026-10-02', 2)
       RETURNING id;`,
      [problemId, performanceTableId],
    );
    const [secondProblem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Segundo Problema', 'Ordem 2', 2, $2)
       RETURNING id;`,
      [roomId, tutorId],
    );
    const [p2Session] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions
        (problem_id, performance_table_id, title, description, date, order_index)
       VALUES ($1, $2, 'Sessão 1 P2', 'Primeira do P2', '2026-10-02', 1)
       RETURNING id;`,
      [secondProblem.id, performanceTableId],
    );

    const allRes = await server()
      .get(performancePath())
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    const allBody = allRes.body as { sessoes: Array<{ sessaoId: string; problemaId: string }> };

    expect(allBody.sessoes.map((s) => s.sessaoId)).toEqual([
      sessionId,
      secondSession.id,
      p2Session.id,
    ]);

    const filteredRes = await server()
      .get(`${performancePath()}?problemaId=${secondProblem.id}`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    const filteredBody = filteredRes.body as {
      sessoes: Array<{ sessaoId: string; problemaId: string }>;
    };

    expect(filteredBody.sessoes).toHaveLength(1);
    expect(filteredBody.sessoes[0]).toMatchObject({
      sessaoId: p2Session.id,
      problemaId: secondProblem.id,
    });
  });

  it('isolates sessions, grades, attendance and marks from other rooms and students', async () => {
    const [otherRoom] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Turma Isolada', 'EXA888', 'ISO88888', '2026.2', true)
       RETURNING id;`,
      [otherTutorId],
    );
    await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      otherRoom.id,
      studentId,
    ]);
    const [otherProblem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema outra turma', 'Não deve vazar', 1, $2)
       RETURNING id;`,
      [otherRoom.id, otherTutorId],
    );
    const [otherSession] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions
        (problem_id, performance_table_id, title, description, date, order_index)
       VALUES ($1, $2, 'Sessão outra turma', 'Isolada', '2026-10-01', 1)
       RETURNING id;`,
      [otherProblem.id, performanceTableId],
    );
    await dataSource.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
       VALUES ($1, $2, $3, 9.9);`,
      [otherSession.id, studentId, criterionId],
    );
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'ABSENT');`,
      [otherSession.id, studentId, otherTutorId],
    );
    const [otherTag] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO behavior_tags (tutor_id, name) VALUES ($1, 'Tag Externa') RETURNING id;`,
      [otherTutorId],
    );
    const [extObs] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO observations (session_id, student_id, author_id, text)
       VALUES ($1, $2, $3, 'Obs externa') RETURNING id;`,
      [otherSession.id, studentId, otherTutorId],
    );
    await dataSource.query(
      'INSERT INTO observation_tags (observation_id, tag_id) VALUES ($1, $2);',
      [extObs.id, otherTag.id],
    );

    const [peerStudent] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Colega Turma', 'colega.grades@discente.uefs.br', 'hash', $1, '20260008', true)
       RETURNING id;`,
      [UserType.STUDENT],
    );
    await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      peerStudent.id,
    ]);
    await dataSource.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
       VALUES ($1, $2, $3, 3.0);`,
      [sessionId, peerStudent.id, criterionId],
    );
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'LATE');`,
      [sessionId, peerStudent.id, tutorId],
    );

    const res = await server()
      .get(performancePath())
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    const body = res.body as { sessoes: Array<Record<string, unknown>> };

    expect(body.sessoes).toHaveLength(1);
    expect(body.sessoes[0]).toMatchObject({
      sessaoId: sessionId,
      problemaId: problemId,
      nota: 8.5,
      presenca: null,
      marcacoes: [],
    });
  });

  it('matches /notas across modalities, adjustments, role bonus, absences and hides draft evaluations', async () => {
    const insertPeer = async (name: string, email: string, registration: string) => {
      const [row] = await dataSource.query<[{ id: string }]>(
        `INSERT INTO users (name, email, password_hash, type, registration_number, active)
         VALUES ($1, $2, 'hash', 'STUDENT', $3, true) RETURNING id;`,
        [name, email, registration],
      );
      await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
        roomId,
        row.id,
      ]);
      return row.id;
    };
    const peer1Id = await insertPeer('Bruno Pares', 'bruno.perf@discente.uefs.br', '20260011');
    const peer2Id = await insertPeer('Carla Pares', 'carla.perf@discente.uefs.br', '20260012');

    // S1 (sessionId): TUTOR (8.5) + role_score (5.5) -> (8.5 * 7 + 5.5 * 3) / 10 = 7.6
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'PRESENT');`,
      [sessionId, studentId, tutorId],
    );
    await dataSource.query(
      `INSERT INTO session_roles (session_id, student_id, role, role_score)
       VALUES ($1, $2, 'COORDINATOR', 5.5);`,
      [sessionId, studentId],
    );

    const createSession = async (
      title: string,
      date: string,
      orderIndex: number,
      flags = { self: false, peer: false, pastDeadline: false },
    ) => {
      const [row] = await dataSource.query<[{ id: string }]>(
        `INSERT INTO sessions
          (problem_id, performance_table_id, title, description, date, order_index,
           self_eval_released, peer_eval_released, self_eval_deadline, peer_eval_deadline)
         VALUES ($1, $2, $3, 'Desc', $4, $5, $6, $7,
           CASE WHEN $6 AND $8 THEN now() - interval '1 day' ELSE NULL END,
           CASE WHEN $7 AND $8 THEN now() - interval '1 day' ELSE NULL END)
         RETURNING id;`,
        [
          problemId,
          performanceTableId,
          title,
          date,
          orderIndex,
          flags.self,
          flags.peer,
          flags.pastDeadline,
        ],
      );
      return row.id;
    };

    // S2: AUTOAVALIACAO with tutor grade adjustment
    const selfSessionId = await createSession('Sessão Auto', '2026-10-03', 2, {
      self: true,
      peer: false,
      pastDeadline: false,
    });
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'PRESENT');`,
      [selfSessionId, studentId, tutorId],
    );
    const [selfEval] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id,
         performance_table_id, type, status, submitted_at, session_score, created_by)
       VALUES ($1, $1, $2, $3, $4, 'SELF_ASSESSMENT', 'SUBMITTED', now(), 5.0, $1)
       RETURNING id;`,
      [studentId, problemId, selfSessionId, performanceTableId],
    );
    await dataSource.query(
      `INSERT INTO grade_adjustments (evaluation_id, previous_value, new_value, justification, created_by)
       VALUES ($1, 5.0, 9.2, 'Ajuste justificado pelo tutor na sessão.', $2);`,
      [selfEval.id, tutorId],
    );

    // S3: PARES (form)
    const peerSessionId = await createSession('Sessão Pares', '2026-10-04', 3, {
      self: false,
      peer: true,
      pastDeadline: true,
    });
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'LATE');`,
      [peerSessionId, studentId, tutorId],
    );
    for (const [evaluatorId, score] of [
      [peer1Id, 6.0],
      [peer2Id, 8.0],
    ] as const) {
      await dataSource.query(
        `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id,
           performance_table_id, type, status, submitted_at, session_score, created_by)
         VALUES ($1, $2, $3, $4, $5, 'PEER_ASSESSMENT', 'SUBMITTED', now(), $6, $1);`,
        [evaluatorId, studentId, problemId, peerSessionId, performanceTableId, score],
      );
    }

    // S4: PLANNING_POKER (decided)
    const pokerSessionId = await createSession('Sessão Poker', '2026-10-05', 4);
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'PRESENT');`,
      [pokerSessionId, studentId, tutorId],
    );
    const [poker] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO poker_sessions (session_id, anonymous, order_mode, status, created_by)
       VALUES ($1, false, 'SEQUENTIAL', 'CLOSED', $2) RETURNING id;`,
      [pokerSessionId, tutorId],
    );
    await dataSource.query(
      `INSERT INTO poker_rounds (poker_id, student_id, round_number, status, seats, average, final_grade, decided_by, decided_at)
       VALUES ($1, $2, 1, 'DECIDED', '[]'::jsonb, 8.0, 8.4, $3, now());`,
      [poker.id, studentId, tutorId],
    );

    // S5: DRAFT tutor evaluation must NOT become final grade
    const draftSessionId = await createSession('Sessão Rascunho Tutor', '2026-10-06', 5);
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'PRESENT');`,
      [draftSessionId, studentId, tutorId],
    );
    await dataSource.query(
      `INSERT INTO session_evaluation_configs (session_id, performance_table_id, table_name, created_by)
       VALUES ($1, $2, 'Tabela de notas', $3);`,
      [draftSessionId, performanceTableId, tutorId],
    );
    const [draftTutorEval] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id, config_session_id,
         performance_table_id, type, status, created_by)
       VALUES ($1, $2, $3, $4, $4, $5, 'TUTOR_SESSION', 'DRAFT', $1)
       RETURNING id;`,
      [tutorId, studentId, problemId, draftSessionId, performanceTableId],
    );
    await dataSource.query(
      `INSERT INTO evaluation_items (evaluation_id, criterion_id, score)
       VALUES ($1, $2, 9.5);`,
      [draftTutorEval.id, criterionId],
    );

    // S6: DRAFT self-assessment must NOT become final grade
    const selfDraftSessionId = await createSession('Sessão Rascunho Auto', '2026-10-07', 6, {
      self: true,
      peer: false,
      pastDeadline: false,
    });
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'PRESENT');`,
      [selfDraftSessionId, studentId, tutorId],
    );
    const [draftSelfEval] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id,
         performance_table_id, type, status, created_by)
       VALUES ($1, $1, $2, $3, $4, 'SELF_ASSESSMENT', 'DRAFT', $1)
       RETURNING id;`,
      [studentId, problemId, selfDraftSessionId, performanceTableId],
    );
    await dataSource.query(
      `INSERT INTO evaluation_items (evaluation_id, criterion_id, score)
       VALUES ($1, $2, 10.0);`,
      [draftSelfEval.id, criterionId],
    );

    // S7: Feedback grade override
    const feedbackSessionId = await createSession('Sessão Feedback', '2026-10-08', 7);
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'PRESENT');`,
      [feedbackSessionId, studentId, tutorId],
    );
    await dataSource.query(
      `INSERT INTO feedback (autor_id, problema_id, destinatario_id, sessao_id, escopo, nota, texto)
       VALUES ($1, $2, $3, $4, 'ALUNO', 9.8, 'Nota consolidada via feedback individual.');`,
      [tutorId, problemId, studentId, feedbackSessionId],
    );

    // S8: ABSENT & S9: EXCUSED
    const absentSessionId = await createSession('Sessão Ausente', '2026-10-09', 8);
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'ABSENT');`,
      [absentSessionId, studentId, tutorId],
    );
    const excusedSessionId = await createSession('Sessão Justificada', '2026-10-10', 9);
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'EXCUSED');`,
      [excusedSessionId, studentId, tutorId],
    );

    const gradesRes = await server()
      .get(gradesPath())
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    const gradesBody = gradesRes.body as {
      alunos: Array<{
        alunoId: string;
        sessoes: Array<{
          sessaoId: string;
          nota: number | null;
          situacao: string;
          modalidade: string;
          pares: { origem?: string };
        }>;
      }>;
    };
    const anaGrades = gradesBody.alunos.find((a) => a.alunoId === studentId)!;

    const perfRes = await server()
      .get(performancePath())
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    const perfBody = perfRes.body as {
      sessoes: Array<{
        sessaoId: string;
        nota: number | null;
        situacao: string;
        modalidade: string;
        presenca: string | null;
      }>;
    };

    expect(perfBody.sessoes).toHaveLength(9);
    for (const perfSession of perfBody.sessoes) {
      const gradeSession = anaGrades.sessoes.find((s) => s.sessaoId === perfSession.sessaoId);
      expect(gradeSession).toBeDefined();
      const expectedModality =
        gradeSession?.modalidade === 'PARES' && gradeSession.pares.origem === 'PLANNING_POKER'
          ? 'PLANNING_POKER'
          : gradeSession?.modalidade;
      expect(perfSession.nota).toBe(gradeSession?.nota);
      expect(perfSession.situacao).toBe(gradeSession?.situacao);
      expect(perfSession.modalidade).toBe(expectedModality);
    }

    expect(perfBody.sessoes).toMatchObject([
      {
        sessaoId: sessionId,
        nota: 7.6,
        situacao: 'AVALIADA',
        modalidade: 'TUTOR',
        presenca: 'PRESENTE',
      },
      {
        sessaoId: selfSessionId,
        nota: 9.2,
        situacao: 'AVALIADA',
        modalidade: 'AUTOAVALIACAO',
        presenca: 'PRESENTE',
      },
      {
        sessaoId: peerSessionId,
        nota: 7,
        situacao: 'AVALIADA',
        modalidade: 'PARES',
        presenca: 'ATRASADO',
      },
      {
        sessaoId: pokerSessionId,
        nota: 8.4,
        situacao: 'AVALIADA',
        modalidade: 'PLANNING_POKER',
        presenca: 'PRESENTE',
      },
      {
        sessaoId: draftSessionId,
        nota: null,
        situacao: 'PENDENTE',
        modalidade: 'TUTOR',
        presenca: 'PRESENTE',
      },
      {
        sessaoId: selfDraftSessionId,
        nota: null,
        situacao: 'PENDENTE',
        modalidade: 'AUTOAVALIACAO',
        presenca: 'PRESENTE',
      },
      {
        sessaoId: feedbackSessionId,
        nota: 9.8,
        situacao: 'AVALIADA',
        modalidade: 'TUTOR',
        presenca: 'PRESENTE',
      },
      {
        sessaoId: absentSessionId,
        nota: 0,
        situacao: 'AUSENTE',
        modalidade: 'TUTOR',
        presenca: 'AUSENTE',
      },
      {
        sessaoId: excusedSessionId,
        nota: null,
        situacao: 'JUSTIFICADA',
        modalidade: 'TUTOR',
        presenca: 'JUSTIFICADO',
      },
    ]);
  });

  it('returns calculated grades and persists session and problem grades', async () => {
    const response = await server()
      .get(gradesPath())
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);

    const body = JSON.parse(response.text) as unknown;
    const grades = body as GradesResponseBody;

    expect(grades.sessoes).toHaveLength(1);
    expect(grades.sessoes[0]).toMatchObject({
      id: sessionId,
      rotulo: 'Sessão de avaliação',
    });
    expect(typeof grades.sessoes[0]?.data).toBe('string');
    expect(grades.sessoes[0]?.data).toContain('2026');
    expect(grades.alunos).toEqual([
      {
        alunoId: studentId,
        nome: 'Ana Discente',
        matricula: '20260001',
        sessoes: [
          {
            sessaoId: sessionId,
            nota: 8.5,
            situacao: 'AVALIADA',
            modalidade: 'TUTOR',
            autoavaliacao: { nota: null, situacao: 'NAO_LIBERADA' },
            pares: { nota: null, situacao: 'NAO_LIBERADA', origem: 'FORMULARIO' },
          },
        ],
        notaFinal: 8.5,
        autoavaliacao: { nota: null, situacao: 'PENDENTE' },
        pares: { nota: null, situacao: 'PENDENTE' },
      },
    ]);
    expect(grades.mediaTurma).toBe(8.5);
    expect(grades.versoesFormula).toEqual({ sessao: null, problema: 0 });

    const [sessionGrade] = await dataSource.query<
      [{ grade: string; situation: string; formula_version: number }]
    >('SELECT grade, situation, formula_version FROM session_grades WHERE session_id = $1', [
      sessionId,
    ]);
    expect(sessionGrade).toMatchObject({
      grade: '8.500000',
      situation: 'AVALIADA',
      formula_version: 1,
    });

    const [problemGrade] = await dataSource.query<[{ grade: string; formula_version: number }]>(
      'SELECT grade, formula_version FROM problem_grades WHERE problem_id = $1 AND student_id = $2',
      [problemId, studentId],
    );
    expect(problemGrade).toMatchObject({ grade: '8.500000', formula_version: 1 });
  });

  it('feeds self (with tutor adjustment) and peer grades into the final formula', async () => {
    const insertStudent = async (name: string, email: string, registration: string) => {
      const [row] = await dataSource.query<[{ id: string }]>(
        `INSERT INTO users (name, email, password_hash, type, registration_number, active)
         VALUES ($1, $2, 'hash', 'STUDENT', $3, true) RETURNING id;`,
        [name, email, registration],
      );
      return row.id;
    };
    const brunoId = await insertStudent(
      'Bruno Discente',
      'bruno.grades@discente.uefs.br',
      '20260002',
    );
    const carlaId = await insertStudent(
      'Carla Discente',
      'carla.grades@discente.uefs.br',
      '20260003',
    );
    await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      brunoId,
    ]);
    await dataSource.query(
      `UPDATE sessions SET self_eval_released = TRUE, peer_eval_released = TRUE,
              self_eval_deadline = now() - interval '1 day',
              peer_eval_deadline = now() - interval '1 day'
        WHERE id = $1;`,
      [sessionId],
    );
    await dataSource.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $4, 'PRESENT'), ($1, $3, $4, 'PRESENT');`,
      [sessionId, studentId, brunoId, tutorId],
    );
    const insertEvaluation = (type: string, evaluatorId: string, score: number) =>
      dataSource.query<[{ id: string }]>(
        `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id,
           performance_table_id, type, status, submitted_at, session_score, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED', now(), $7, $1) RETURNING id;`,
        [evaluatorId, studentId, problemId, sessionId, performanceTableId, type, score],
      );
    const [selfAssessment] = await insertEvaluation('SELF_ASSESSMENT', studentId, 5);
    await dataSource.query(
      `INSERT INTO grade_adjustments (evaluation_id, previous_value, new_value, justification, created_by)
       VALUES ($1, 5, 9, 'Revisão após conversa com a aluna.', $2);`,
      [selfAssessment.id, tutorId],
    );
    await insertEvaluation('PEER_ASSESSMENT', brunoId, 8);
    await insertEvaluation('PEER_ASSESSMENT', carlaId, 6);
    const [formula] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO formulas (problem_id, scope, version, active, created_by)
       VALUES ($1, 'PROBLEMA', 2, TRUE, $2) RETURNING id;`,
      [problemId, tutorId],
    );
    await dataSource.query(
      `INSERT INTO formula_components (formula_id, type, weight)
       VALUES ($1, 'MEDIA_SESSOES', 60), ($1, 'AUTOAVALIACAO', 20), ($1, 'PARES', 20);`,
      [formula.id],
    );

    const response = await server()
      .get(gradesPath())
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    const grades = JSON.parse(response.text) as GradesResponseBody;
    const ana = grades.alunos.find((student) => student.alunoId === studentId);
    const bruno = grades.alunos.find((student) => student.alunoId === brunoId);

    expect(ana).toMatchObject({
      notaFinal: 9,
      autoavaliacao: { nota: 9, situacao: 'AVALIADA' },
      pares: { nota: 7, situacao: 'AVALIADA' },
      sessoes: [
        {
          nota: 9,
          autoavaliacao: { nota: 9, situacao: 'AVALIADA' },
          pares: { nota: 7, situacao: 'AVALIADA' },
        },
      ],
    });
    const formulaResponse = await server()
      .get(`/api/salas/${roomId}/problemas/${problemId}/formulas?escopo=PROBLEMA`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    expect((formulaResponse.body as { componentes: unknown[] }).componentes).toEqual([
      { tipo: 'MEDIA_SESSOES', referenciaId: null, nome: 'Média das Sessões', peso: 100 },
    ]);
    expect(bruno).toMatchObject({
      autoavaliacao: { nota: 0, situacao: 'AVALIADA' },
      pares: { nota: null, situacao: 'PENDENTE' },
      sessoes: [
        {
          autoavaliacao: { nota: 0, situacao: 'NAO_ENVIADA' },
          pares: { nota: null, situacao: 'SEM_AVALIACOES' },
        },
      ],
    });
  });

  it('returns 401 when the request has no authentication token', async () => {
    await server().get(gradesPath()).expect(401);
  });

  it('returns 403 when a student requests the grades', async () => {
    await server().get(gradesPath()).set('Authorization', `Bearer ${studentToken}`).expect(403);
  });
});
