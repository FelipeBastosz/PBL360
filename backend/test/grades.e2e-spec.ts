import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, signAccessToken } from './helpers/fixtures';

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

  it('allows the active co-tutor and restricts access to linked tutors and students', async () => {
    await server()
      .get(`${performancePath()}?problemaId=${problemId}`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .expect(200);
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

  it('validates the problem filter and returns 404 for an unlinked student or problem', async () => {
    await server()
      .get(`${performancePath()}?problemaId=invalido`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(400);
    await server()
      .get(`${performancePath()}?problemaId=00000000-0000-4000-8000-000000000000`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(404);
    await server()
      .get(`/api/salas/${roomId}/alunos/00000000-0000-4000-8000-000000000000/desempenho`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(404);
  });

  it('returns an empty session list when the problem has no sessions', async () => {
    await dataSource.query('DELETE FROM sessions WHERE id = $1;', [sessionId]);

    const response = await server()
      .get(`${performancePath()}?problemaId=${problemId}`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      sala: { id: roomId },
      aluno: { id: studentId },
      sessoes: [],
    });
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
