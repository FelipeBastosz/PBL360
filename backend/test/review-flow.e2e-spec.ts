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

    // 1. Criar usuários: Tutor, Co-tutor, Aluna Ana, Aluno João
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

    // 2. Criar sala e vincular membros
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

    // 3. Criar Barema PBL da Review com 2 critérios e pesos
    // Critério 1: peso 3 (60%), Critério 2: peso 2 (40%) -> Total 5
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

    // 4. Criar problema e 2 sessões
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
    // -------------------------------------------------------------
    // ETAPA 1: Chamada Tutorial na Sessão 1 e Sessão 2
    // -------------------------------------------------------------
    // Sessão 1: Ana e João presentes nos lugares 1 e 2
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

    // Sessão 2: Ana presente no lugar 1; João com falta justificada
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

    // -------------------------------------------------------------
    // ETAPA 2: Papéis da Sessão e Nota Bônus
    // -------------------------------------------------------------
    // Sessão 1: Ana = COORDENADOR (+0.5), João = SECRETARIO_MESA (+0.3)
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

    // Sessão 2: Ana = SECRETARIO_MESA (+0.2)
    await server()
      .put(`/api/sessoes/${session2Id}/papeis/${anaId}`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .send({ papel: 'SECRETARIO_MESA', notaAdicional: 0.2 })
      .expect(200);

    // -------------------------------------------------------------
    // ETAPA 3: Observações Comportamentais e Tags Rápidas
    // -------------------------------------------------------------
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

    // -------------------------------------------------------------
    // ETAPA 4: Avaliação do Tutor por Critérios
    // -------------------------------------------------------------
    // Sessão 1:
    // Ana: Domínio Conceitual = 9.0 (peso 3), Colaboração e Postura = 8.0 (peso 2)
    // João: Domínio Conceitual = 7.0 (peso 3), Colaboração e Postura = 9.0 (peso 2)
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

    // Sessão 2:
    // Ana: Domínio Conceitual = 9.5 (peso 3), Colaboração e Postura = 9.0 (peso 2)
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

    // Persistir notas nos critérios em criterion_grades para alimentar o motor de cálculo
    await dataSource.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score) VALUES
       ($1, $2, $3, 9.0), ($1, $2, $4, 8.0),
       ($1, $5, $3, 7.0), ($1, $5, $4, 9.0),
       ($6, $2, $3, 9.5), ($6, $2, $4, 9.0);`,
      [session1Id, anaId, criterion1Id, criterion2Id, joaoId, session2Id],
    );

    // -------------------------------------------------------------
    // ETAPA 5: Conferência das Notas Contra Valores Calculados à Mão
    // -------------------------------------------------------------
    //
    // MEMÓRIA DE CÁLCULO FEITA À MÃO:
    // Pesos: C1 = 3, C2 = 2 (Total = 5)
    //
    // Aluna Ana Souza:
    // Sessão 1:
    //   - Média ponderada = (9.0 * 3 + 8.0 * 2) / 5 = (27.0 + 16.0) / 5 = 43.0 / 5 = 8.60
    //   - Bônus de Coordenadora = +0.50
    //   - Nota S1 = min(10.0, 8.60 + 0.50) = 9.10 -> round 1 casa = 9.1
    //   - Situação = 'AVALIADA'
    // Sessão 2:
    //   - Média ponderada = (9.5 * 3 + 9.0 * 2) / 5 = (28.5 + 18.0) / 5 = 46.5 / 5 = 9.30
    //   - Bônus de Secretária = +0.20
    //   - Nota S2 = min(10.0, 9.30 + 0.20) = 9.50 -> round 1 casa = 9.5
    //   - Situação = 'AVALIADA'
    // Nota Final do Problema:
    //   - Média simples das sessões = (9.10 + 9.50) / 2 = 18.60 / 2 = 9.30 -> round 1 casa = 9.3
    //
    // Aluno João Silva:
    // Sessão 1:
    //   - Média ponderada = (7.0 * 3 + 9.0 * 2) / 5 = (21.0 + 18.0) / 5 = 39.0 / 5 = 7.80
    //   - Bônus de Secretário = +0.30
    //   - Nota S1 = min(10.0, 7.80 + 0.30) = 8.10 -> round 1 casa = 8.1
    //   - Situação = 'AVALIADA'
    // Sessão 2:
    //   - Falta Justificada (EXCUSED)
    //   - Nota S2 = null
    //   - Situação = 'JUSTIFICADA'
    // Nota Final do Problema:
    //   - Apenas sessão 1 avaliada entra no cálculo = 8.10 -> round 1 casa = 8.1
    //
    // Média da Turma:
    //   - Média das notas finais presentes = (9.30 + 8.10) / 2 = 17.40 / 2 = 8.70 -> round 1 casa = 8.7
    //
    const gradesRes = await server()
      .get(`/api/salas/${roomId}/problemas/${problemId}/notas`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);

    const grades = gradesRes.body as GradesResponseBody;

    expect(grades.sessoes).toHaveLength(2);
    expect(grades.mediaTurma).toBe(8.7);

    const anaGrade = grades.alunos.find((a) => a.alunoId === anaId);
    expect(anaGrade).toBeDefined();
    expect(anaGrade?.nome).toBe('Ana Souza');
    expect(anaGrade?.matricula).toBe('20261001');
    expect(anaGrade?.sessoes).toEqual([
      { sessaoId: session1Id, nota: 9.1, situacao: 'AVALIADA' },
      { sessaoId: session2Id, nota: 9.5, situacao: 'AVALIADA' },
    ]);
    expect(anaGrade?.notaFinal).toBe(9.3);

    const joaoGrade = grades.alunos.find((a) => a.alunoId === joaoId);
    expect(joaoGrade).toBeDefined();
    expect(joaoGrade?.nome).toBe('João Silva');
    expect(joaoGrade?.matricula).toBe('20261002');
    expect(joaoGrade?.sessoes).toEqual([
      { sessaoId: session1Id, nota: 8.1, situacao: 'AVALIADA' },
      { sessaoId: session2Id, nota: null, situacao: 'JUSTIFICADA' },
    ]);
    expect(joaoGrade?.notaFinal).toBe(8.1);

    // Conferir persistência exata no banco de dados
    const [anaDbS1] = await dataSource.query<[{ grade: string; situation: string }]>(
      `SELECT grade, situation FROM session_grades WHERE session_id = $1 AND student_id = $2;`,
      [session1Id, anaId],
    );
    expect(Number(anaDbS1.grade)).toBeCloseTo(9.1, 4);
    expect(anaDbS1.situation).toBe('AVALIADA');

    const [joaoDbS2] = await dataSource.query<[{ grade: string | null; situation: string }]>(
      `SELECT grade, situation FROM session_grades WHERE session_id = $1 AND student_id = $2;`,
      [session2Id, joaoId],
    );
    expect(joaoDbS2.grade).toBeNull();
    expect(joaoDbS2.situation).toBe('JUSTIFICADA');

    // -------------------------------------------------------------
    // ETAPA 6: Feedbacks da Sessão
    // -------------------------------------------------------------
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
