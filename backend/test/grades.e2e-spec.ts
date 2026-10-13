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
  let studentId: string;
  let roomId: string;
  let problemId: string;
  let sessionId: string;
  let criterionId: string;
  let performanceTableId: string;
  let tutorToken: string;
  let studentToken: string;

  const server = () => request(app.getHttpServer() as Server);
  const gradesPath = () => `/api/salas/${roomId}/problemas/${problemId}/notas`;

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
    studentToken = signAccessToken(app, studentId, 'ana.grades@discente.uefs.br', UserType.STUDENT);
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
            autoavaliacao: { nota: null, situacao: 'NAO_LIBERADA' },
            pares: { nota: null, situacao: 'NAO_LIBERADA' },
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
      notaFinal: 8.3,
      autoavaliacao: { nota: 9, situacao: 'AVALIADA' },
      pares: { nota: 7, situacao: 'AVALIADA' },
      sessoes: [
        {
          nota: 8.5,
          autoavaliacao: { nota: 9, situacao: 'AVALIADA' },
          pares: { nota: 7, situacao: 'AVALIADA' },
        },
      ],
    });
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
