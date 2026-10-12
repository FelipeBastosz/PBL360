import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, signAccessToken } from './helpers/fixtures';

interface GradesResponseBody {
  sessoes: Array<{ id: string; rotulo: string; data: string }>;
  alunos: Array<{
    alunoId: string;
    nome: string;
    matricula: string | null;
    sessoes: Array<{ sessaoId: string; nota: number | null; situacao: string }>;
    notaFinal: number | null;
  }>;
  mediaTurma: number | null;
  versoesFormula: { sessao: number | null; problema: number | null };
}

describe('Review Walkthrough Flow & Calculation Verification (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let tutorId: string;
  let coTutorId: string;
  let anaId: string;
  let joaoId: string;

  let tutorToken: string;
  let coTutorToken: string;

  let roomId: string;
  let tableId: string;
  let criterion1Id: string;
  let criterion2Id: string;
  let problemId: string;
  let session1Id: string;
  let session2Id: string;

  const server = () => request(app.getHttpServer() as Server);

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
       VALUES ('Carlos Mendes', 'carlos.review@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    tutorId = tutor.id;

    const [coTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Maria Santos', 'maria.review@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    coTutorId = coTutor.id;

    const [ana] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Ana Souza', 'ana.review@discente.uefs.br', 'hash', $1, '20261001', true)
       RETURNING id;`,
      [UserType.STUDENT],
    );
    anaId = ana.id;

    const [joao] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('João Silva', 'joao.review@discente.uefs.br', 'hash', $1, '20261002', true)
       RETURNING id;`,
      [UserType.STUDENT],
    );
    joaoId = joao.id;

    tutorToken = signAccessToken(app, tutorId, 'carlos.review@uefs.br', UserType.TUTOR);
    coTutorToken = signAccessToken(app, coTutorId, 'maria.review@uefs.br', UserType.TUTOR);

    // Create the room and enroll its members.
    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Engenharia de Software - Turma Review', 'EXA123', 'REV2026A', '2026.2', true)
       RETURNING id;`,
      [tutorId],
    );
    roomId = room.id;

    await dataSource.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      roomId,
      coTutorId,
    ]);
    await dataSource.query(
      `INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);`,
      [roomId, anaId, joaoId],
    );

    const [table] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default)
       VALUES ($1, 'Barema da Review', false)
       RETURNING id;`,
      [tutorId],
    );
    tableId = table.id;

    const [c1] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Domínio Conceitual', 1, 3)
       RETURNING id;`,
      [tableId],
    );
    criterion1Id = c1.id;

    const [c2] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Colaboração e Postura', 2, 2)
       RETURNING id;`,
      [tableId],
    );
    criterion2Id = c2.id;

    const [problem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by, performance_table_id)
       VALUES ($1, 'Problema 1 - Prontuário Eletrônico', 'Descrição da Review', 1, $2, $3)
       RETURNING id;`,
      [roomId, tutorId, tableId],
    );
    problemId = problem.id;

    const [s1] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, title, description, date, order_index, status)
       VALUES ($1, 'Sessão 1 - Abertura', 'Abertura do caso', '2026-10-01', 1, 'concluida')
       RETURNING id;`,
      [problemId],
    );
    session1Id = s1.id;

    const [s2] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, title, description, date, order_index, status)
       VALUES ($1, 'Sessão 2 - Fechamento', 'Fechamento do caso', '2026-10-08', 2, 'agendada')
       RETURNING id;`,
      [problemId],
    );
    session2Id = s2.id;
  });

  it('completes entire review walkthrough and verifies calculation engine against hand-calculated values', async () => {
    await server()
      .put(`/api/sessoes/${session1Id}/chamada`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        registros: [
          { alunoId: anaId, status: 'PRESENTE', lugar: 1 },
          { alunoId: joaoId, status: 'PRESENTE', lugar: 2 },
        ],
      })
      .expect(200);

    await server()
      .put(`/api/sessoes/${session2Id}/chamada`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .send({
        registros: [
          { alunoId: anaId, status: 'PRESENTE', lugar: 1 },
          {
            alunoId: joaoId,
            status: 'JUSTIFICADO',
            justificativa: 'Participação em congresso acadêmico',
          },
        ],
      })
      .expect(200);

    await server()
      .put(`/api/sessoes/${session1Id}/papeis/${anaId}`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ papel: 'COORDENADOR', notaAdicional: 0.5 })
      .expect(200);

    await server()
      .put(`/api/sessoes/${session1Id}/papeis/${joaoId}`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ papel: 'SECRETARIO_MESA', notaAdicional: 0.3 })
      .expect(200);

    await server()
      .put(`/api/sessoes/${session2Id}/papeis/${anaId}`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .send({ papel: 'SECRETARIO_MESA', notaAdicional: 0.2 })
      .expect(200);

    await server()
      .post(`/api/sessoes/${session1Id}/alunos/${anaId}/observacoes`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ texto: 'Demonstrou excelente liderança e organização nos objetivos da discussão.' })
      .expect(201);

    await server()
      .post(`/api/sessoes/${session1Id}/alunos/${joaoId}/observacoes`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ texto: 'Anotações claras e síntese precisa dos conceitos levantados pelo grupo.' })
      .expect(201);

    await server()
      .put(`/api/sessoes/${session1Id}/avaliacoes/${anaId}`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        itens: [
          { criterioId: criterion1Id, nota: 9.0 },
          { criterioId: criterion2Id, nota: 8.0 },
        ],
        enviar: true,
      })
      .expect(200);

    await server()
      .put(`/api/sessoes/${session1Id}/avaliacoes/${joaoId}`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        itens: [
          { criterioId: criterion1Id, nota: 7.0 },
          { criterioId: criterion2Id, nota: 9.0 },
        ],
        enviar: true,
      })
      .expect(200);

    await server()
      .put(`/api/sessoes/${session2Id}/avaliacoes/${anaId}`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .send({
        itens: [
          { criterioId: criterion1Id, nota: 9.5 },
          { criterioId: criterion2Id, nota: 9.0 },
        ],
        enviar: true,
      })
      .expect(200);

    // Default formula: 70% weighted criteria + 30% role score (scaled from 0..1 to 0..10).
    // Ana S1: ((9 * 3 + 8 * 2) / 5) * 0.7 + 5 * 0.3 = 7.52 -> 7.5.
    // Ana S2: ((9.5 * 3 + 9 * 2) / 5) * 0.7 + 2 * 0.3 = 7.11 -> 7.1.
    // Ana final: (7.52 + 7.11) / 2 = 7.315 -> 7.3.
    // Joao S1: ((7 * 3 + 9 * 2) / 5) * 0.7 + 3 * 0.3 = 6.36 -> 6.4.
    // Joao S2 is excused and does not enter his final grade: 6.36 -> 6.4.
    // The existing class average uses presented final grades: (7.3 + 6.4) / 2 -> 6.9.
    // Read grades directly from submitted evaluations, without duplicating criterion_grades.
    const gradesRes = await server()
      .get(`/api/salas/${roomId}/problemas/${problemId}/notas`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);

    const grades = gradesRes.body as GradesResponseBody;

    expect(grades.sessoes).toHaveLength(2);
    expect(grades.mediaTurma).toBe(6.9);

    const anaGrade = grades.alunos.find((a) => a.alunoId === anaId);
    expect(anaGrade).toBeDefined();
    expect(anaGrade?.nome).toBe('Ana Souza');
    expect(anaGrade?.matricula).toBe('20261001');
    expect(anaGrade?.sessoes).toEqual([
      { sessaoId: session1Id, nota: 7.5, situacao: 'AVALIADA' },
      { sessaoId: session2Id, nota: 7.1, situacao: 'AVALIADA' },
    ]);
    expect(anaGrade?.notaFinal).toBe(7.3);

    const joaoGrade = grades.alunos.find((a) => a.alunoId === joaoId);
    expect(joaoGrade).toBeDefined();
    expect(joaoGrade?.nome).toBe('João Silva');
    expect(joaoGrade?.matricula).toBe('20261002');
    expect(joaoGrade?.sessoes).toEqual([
      { sessaoId: session1Id, nota: 6.4, situacao: 'AVALIADA' },
      { sessaoId: session2Id, nota: null, situacao: 'JUSTIFICADA' },
    ]);
    expect(joaoGrade?.notaFinal).toBe(6.4);

    const [anaDbS1] = await dataSource.query<[{ grade: string; situation: string }]>(
      `SELECT grade, situation FROM session_grades WHERE session_id = $1 AND student_id = $2;`,
      [session1Id, anaId],
    );
    expect(Number(anaDbS1.grade)).toBeCloseTo(7.52, 4);
    expect(anaDbS1.situation).toBe('AVALIADA');

    const [joaoDbS2] = await dataSource.query<[{ grade: string | null; situation: string }]>(
      `SELECT grade, situation FROM session_grades WHERE session_id = $1 AND student_id = $2;`,
      [session2Id, joaoId],
    );
    expect(joaoDbS2.grade).toBeNull();
    expect(joaoDbS2.situation).toBe('JUSTIFICADA');

    await server()
      .put(`/api/sessoes/${session1Id}/alunos/${anaId}/feedback`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ texto: 'Excelente liderança na condução da abertura do caso como coordenadora.' })
      .expect(200);

    await server()
      .put(`/api/sessoes/${session1Id}/alunos/${joaoId}/feedback`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ texto: 'Anotações impecáveis e colaboração exemplar na mesa tutorial.' })
      .expect(200);

    const anaFbRes = await server()
      .get(`/api/sessoes/${session1Id}/alunos/${anaId}/feedback`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .expect(200);
    expect((anaFbRes.body as { texto: string }).texto).toContain('Excelente liderança');
  });
});
