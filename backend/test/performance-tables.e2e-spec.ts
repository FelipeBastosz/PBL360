import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { type PerformanceTableResponseDto } from '@/performance-tables/application/dtos/performance-table-response.dto';
import type { UpdatePerformanceTableDto } from '@/performance-tables/application/dtos/update-performance-table.dto';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '@/performance-tables/domain/repositories/performance-table.repository';
import { InvalidPerformanceTableError } from '@/performance-tables/domain/errors/invalid-performance-table.error';
import { type ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { signAccessToken } from './helpers/fixtures';

describe('Performance tables (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let ownerId: string;
  let otherTutorId: string;
  let studentId: string;
  let tableId: string;
  let ownerToken: string;
  let otherTutorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());
    dataSource = moduleRef.get(DataSource);
  });

  const cleanupDb = async () => {
    await dataSource.query('DELETE FROM grade_recalculation_history;');
    await dataSource.query('DELETE FROM evaluation_items;');
    await dataSource.query('DELETE FROM evaluations;');
    await dataSource.query('DELETE FROM session_evaluation_criteria;');
    await dataSource.query('DELETE FROM session_evaluation_configs;');
    await dataSource.query('DELETE FROM sessions;');
    await dataSource.query('DELETE FROM problems;');
    await dataSource.query('DELETE FROM performance_criteria;');
    await dataSource.query('DELETE FROM performance_tables;');
    await dataSource.query('DELETE FROM room_tutors;');
    await dataSource.query('DELETE FROM rooms;');
    await dataSource.query('DELETE FROM users;');
  };

  afterAll(async () => {
    await cleanupDb();
    await app.close();
  });

  beforeEach(async () => {
    await cleanupDb();
    const [owner] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Professor Responsável', 'owner@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    ownerId = owner.id;
    const [otherTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Outro Professor', 'other@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    otherTutorId = otherTutor.id;
    const [student] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Aluno', 'aluno@discente.uefs.br', 'hash', '${UserType.STUDENT}', true)
       RETURNING id;`,
    );
    studentId = student.id;
    const [table] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Tabela de teste', FALSE) RETURNING id;`,
      [ownerId],
    );
    tableId = table.id;
    await dataSource.query(
      `INSERT INTO performance_criteria (performance_table_id, name, weight) VALUES ($1, 'Critério', 10);`,
      [tableId],
    );
    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala', 'EXA123', 'ROOM1234', '2026.2', true) RETURNING id;`,
      [ownerId],
    );
    await dataSource.query(
      `INSERT INTO problems (room_id, title, created_by)
       VALUES ($1, 'Problema vinculado', $2);`,
      [room.id, ownerId],
    );
    ownerToken = signAccessToken(app, ownerId, 'owner@uefs.br', UserType.TUTOR);
    otherTutorToken = signAccessToken(app, otherTutorId, 'other@uefs.br', UserType.TUTOR);
    studentToken = signAccessToken(app, studentId, 'aluno@discente.uefs.br', UserType.STUDENT);
  });

  const deleteTable = (token: string, id = tableId) =>
    request(app.getHttpServer() as Server)
      .delete(`/api/tabelas-desempenho/${id}`)
      .set('Authorization', `Bearer ${token}`);

  const getTable = (id: string, token: string) =>
    request(app.getHttpServer() as Server)
      .get(`/api/tabelas-desempenho/${id}`)
      .set('Authorization', `Bearer ${token}`);

  it('retrieves performance table with criteria sorted by order_index and linked problems count', async () => {
    const [problem] = await dataSource.query<[{ id: string }]>('SELECT id FROM problems LIMIT 1;');
    await dataSource.query(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
       VALUES ($1, $2, 'Sessão vinculada', CURRENT_DATE, 1);`,
      [problem.id, tableId],
    );
    await dataSource.query('DELETE FROM performance_criteria WHERE performance_table_id = $1;', [
      tableId,
    ]);
    await dataSource.query(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Segundo Critério', 2, 7), ($1, 'Primeiro Critério', 1, 3);`,
      [tableId],
    );

    const res = await getTable(tableId, ownerToken).expect(200);
    const body = res.body as PerformanceTableResponseDto;

    expect(body).toMatchObject({
      id: tableId,
      professorId: ownerId,
      nome: 'Tabela de teste',
      quantidadeProblemas: 1,
    });
    expect(body.criterios).toHaveLength(2);
    expect(body.criterios[0]).toMatchObject({
      nome: 'Primeiro Critério',
      ordem: 1,
      peso: 3,
    });
    expect(body.criterios[1]).toMatchObject({
      nome: 'Segundo Critério',
      ordem: 2,
      peso: 7,
    });
  });

  it('rejects retrieval by a tutor who does not own the table', async () => {
    const res = await getTable(tableId, otherTutorToken).expect(403);
    const body = res.body as ErrorResponseDto;
    expect(body.message).toBe('Você não tem permissão para acessar esta tabela de desempenho.');
  });

  it('allows only tutors to retrieve a performance table', async () => {
    await getTable(tableId, studentToken).expect(403);
  });

  it('returns 404 when retrieving a non-existent table', async () => {
    await getTable('00000000-0000-0000-0000-000000000000', ownerToken).expect(404);
  });

  it('deletes the original while its independent applied copy remains active', async () => {
    const [problem] = await dataSource.query<[{ id: string }]>('SELECT id FROM problems LIMIT 1;');
    const [room] = await dataSource.query<[{ id: string }]>(
      'SELECT room_id AS id FROM problems LIMIT 1;',
    );
    const [copy] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables
         (tutor_id, room_id, name, description, is_default, source_table_id, is_session_copy)
       SELECT tutor_id, $2, name, description, FALSE, id, TRUE
         FROM performance_tables WHERE id = $1
       RETURNING id;`,
      [tableId, room.id],
    );
    await dataSource.query(
      `INSERT INTO performance_criteria
         (performance_table_id, name, description, order_index, weight, source_criterion_id)
       SELECT $2, name, description, order_index, weight, id
         FROM performance_criteria WHERE performance_table_id = $1;`,
      [tableId, copy.id],
    );
    await dataSource.query(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
       VALUES ($1, $2, 'Sessão vinculada', CURRENT_DATE, 1);`,
      [problem.id, copy.id],
    );
    await deleteTable(ownerToken).expect(204);

    const [table] = await dataSource.query<{ deleted_at: Date | null }[]>(
      'SELECT deleted_at FROM performance_tables WHERE id = $1;',
      [tableId],
    );
    const [criteria] = await dataSource.query<{ count: number }[]>(
      'SELECT COUNT(*)::int AS count FROM performance_criteria WHERE performance_table_id = $1;',
      [copy.id],
    );
    const [problems] = await dataSource.query<{ count: number }[]>(
      'SELECT COUNT(DISTINCT problem_id)::int AS count FROM sessions WHERE performance_table_id = $1;',
      [copy.id],
    );

    if (!table || !criteria || !problems) {
      throw new Error('Expected table, criterion, and problem rows.');
    }

    expect(table.deleted_at).not.toBeNull();
    expect(criteria.count).toBe(1);
    expect(problems.count).toBe(1);
    await getTable(copy.id, ownerToken).expect(200);
  });

  it('rejects deletion of an applied table for every tutor, including its author', async () => {
    const [problem] = await dataSource.query<[{ id: string }]>('SELECT id FROM problems LIMIT 1;');
    const [room] = await dataSource.query<[{ id: string }]>(
      'SELECT room_id AS id FROM problems LIMIT 1;',
    );
    const [copy] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables
         (tutor_id, room_id, name, description, is_default, source_table_id, is_session_copy)
       SELECT tutor_id, $2, name, description, FALSE, id, TRUE
         FROM performance_tables WHERE id = $1
       RETURNING id;`,
      [tableId, room.id],
    );
    await dataSource.query(
      `INSERT INTO performance_criteria (performance_table_id, name, weight)
       VALUES ($1, 'Critério aplicado', 10);`,
      [copy.id],
    );
    await dataSource.query(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
       VALUES ($1, $2, 'Sessão vinculada', CURRENT_DATE, 1);`,
      [problem.id, copy.id],
    );

    await deleteTable(ownerToken, copy.id).expect(409);
    await deleteTable(otherTutorToken, copy.id).expect(403);
  });

  it('rejects deletion by a tutor who does not own the table', async () => {
    await deleteTable(otherTutorToken).expect(403);

    const [table] = await dataSource.query<{ deleted_at: Date | null }[]>(
      'SELECT deleted_at FROM performance_tables WHERE id = $1;',
      [tableId],
    );

    if (!table) throw new Error('Expected table row.');
    expect(table.deleted_at).toBeNull();
  });

  it('allows only tutors to use the delete operation', async () => {
    await deleteTable(studentToken).expect(403);
  });

  const updateTable = (payload: UpdatePerformanceTableDto, token = ownerToken) =>
    request(app.getHttpServer() as Server)
      .put(`/api/tabelas-desempenho/${tableId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

  const readCriteria = () =>
    dataSource.query<
      {
        id: string;
        name: string;
        order_index: number;
        weight: string;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }[]
    >(
      `SELECT id, name, order_index, weight, deleted_at, created_at, updated_at
       FROM performance_criteria WHERE performance_table_id = $1 ORDER BY id;`,
      [tableId],
    );

  it('updates an existing criterion by id and inserts only the new criterion', async () => {
    const [original] = await readCriteria();
    const response = await updateTable({
      nome: 'Tabela atualizada',
      descricao: null,
      criterios: [
        { id: original!.id, nome: 'Participação', peso: 6, ordem: 1 },
        { nome: 'Evolução', peso: 4, ordem: 2 },
      ],
    }).expect(200);
    const body = response.body as PerformanceTableResponseDto;
    const rows = await readCriteria();

    expect(body.nome).toBe('Tabela atualizada');
    expect(body.descricao).toBeNull();
    expect(body.criterios).toHaveLength(2);
    expect(body.criterios[0]).toMatchObject({ id: original!.id, nome: 'Participação', peso: 6 });
    expect(body.criterios[1]!.id).not.toBe(original!.id);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === original!.id)).toMatchObject({
      created_at: original!.created_at,
      deleted_at: null,
    });
  });

  it('archives only omitted criteria and excludes them from the current table', async () => {
    const [retained] = await readCriteria();
    const [removed] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Autonomia', 2, 5) RETURNING id;`,
      [tableId],
    );

    await updateTable({
      nome: 'Tabela',
      criterios: [{ id: retained!.id, nome: 'Participação', peso: 10 }],
    }).expect(200);

    const rows = await readCriteria();
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === retained!.id)!.deleted_at).toBeNull();
    expect(rows.find((row) => row.id === removed!.id)).toMatchObject({
      name: 'Autonomia',
      order_index: 2,
      deleted_at: expect.any(Date) as Date,
    });
    const response = await getTable(tableId, ownerToken).expect(200);
    const body = response.body as PerformanceTableResponseDto;
    expect(body.criterios.map((criterion) => criterion.id)).toEqual([retained!.id]);
  });

  it('archives all previous criteria when every submitted criterion is new', async () => {
    const [original] = await readCriteria();
    const response = await updateTable({
      nome: 'Tabela',
      criterios: [{ nome: 'Evolução', peso: 10 }],
    }).expect(200);
    const body = response.body as PerformanceTableResponseDto;
    const rows = await readCriteria();

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === original!.id)!.deleted_at).not.toBeNull();
    expect(body.criterios).toHaveLength(1);
    expect(body.criterios[0]!.id).not.toBe(original!.id);
    expect(body.criterios[0]!.ordem).toBe(1);
  });

  it('swaps criterion positions without changing their ids', async () => {
    const [first] = await readCriteria();
    const [second] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Segundo', 2, 5) RETURNING id;`,
      [tableId],
    );
    const response = await updateTable({
      nome: 'Tabela',
      criterios: [
        { id: first!.id, nome: 'Primeiro', ordem: 2, peso: 5 },
        { id: second!.id, nome: 'Segundo', ordem: 1, peso: 5 },
      ],
    }).expect(200);
    const body = response.body as PerformanceTableResponseDto;

    expect(body.criterios.map((criterion) => criterion.id)).toEqual([second!.id, first!.id]);
    expect(body.criterios.map((criterion) => criterion.ordem)).toEqual([1, 2]);
    expect((await readCriteria()).every((row) => row.deleted_at === null)).toBe(true);
  });

  it('rejects duplicate criterion ids without modifying the stored configuration', async () => {
    const before = await readCriteria();
    await updateTable({
      nome: 'Não salvar',
      criterios: [
        { id: before[0]!.id, nome: 'Primeiro', ordem: 1, peso: 5 },
        { id: before[0]!.id, nome: 'Segundo', ordem: 2, peso: 5 },
      ],
    }).expect(400);

    expect(await readCriteria()).toEqual(before);
    const response = await getTable(tableId, ownerToken).expect(200);
    expect((response.body as PerformanceTableResponseDto).nome).toBe('Tabela de teste');
  });

  it('rejects criterion ids from another table', async () => {
    const [otherTable] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Outra tabela', FALSE) RETURNING id;`,
      [otherTutorId],
    );
    const [foreign] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name, weight)
       VALUES ($1, 'Outro critério', 10) RETURNING id;`,
      [otherTable!.id],
    );
    const before = await readCriteria();
    await updateTable({
      nome: 'Tabela',
      criterios: [{ id: foreign!.id, nome: 'Alterado', peso: 10 }],
    }).expect(400);
    expect(await readCriteria()).toEqual(before);
  });

  it('does not reactivate a previously archived criterion', async () => {
    const [original] = await readCriteria();
    await updateTable({ nome: 'Tabela', criterios: [{ nome: 'Novo', peso: 10 }] }).expect(200);
    const before = await readCriteria();

    await updateTable({
      nome: 'Tabela',
      criterios: [{ id: original!.id, nome: 'Antigo', peso: 10 }],
    }).expect(400);
    expect(await readCriteria()).toEqual(before);
  });

  it('rejects removal of the last criterion', async () => {
    const before = await readCriteria();
    await updateTable({ nome: 'Tabela', criterios: [] }).expect(400);
    expect(await readCriteria()).toEqual(before);
  });

  it('requires ownership and the tutor role to update a table', async () => {
    const before = await readCriteria();
    const payload = { nome: 'Tabela', criterios: [{ nome: 'Novo', peso: 10 }] };
    await updateTable(payload, otherTutorToken).expect(403);
    await updateTable(payload, studentToken).expect(403);
    expect(await readCriteria()).toEqual(before);
  });

  it.each([1, 10])(
    'propagates past-session weights with formula scale %s and records notices once',
    async (scale) => {
      const [problem] = await dataSource.query<{ id: string }[]>(
        'SELECT id FROM problems LIMIT 1;',
      );
      await dataSource.query(
        'UPDATE performance_tables SET is_session_copy = TRUE, room_id = (SELECT room_id FROM problems WHERE id = $2) WHERE id = $1;',
        [tableId, problem!.id],
      );
      const [initialCriterion] = await readCriteria();
      await dataSource.query('UPDATE performance_criteria SET weight = 5 WHERE id = $1;', [
        initialCriterion!.id,
      ]);
      const [secondCriterion] = await dataSource.query<{ id: string }[]>(
        `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Segundo critério', 2, 5) RETURNING id;`,
        [tableId],
      );
      const [session] = await dataSource.query<{ id: string }[]>(
        `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
       VALUES ($1, $2, 'Sessão passada', CURRENT_DATE - 1, 1) RETURNING id;`,
        [problem!.id, tableId],
      );
      const formulaComponents = await dataSource.query<Array<{ id: string }>>(
        `UPDATE formula_components fc
          SET weight = CASE fc.type WHEN 'CRITERIOS' THEN $2::numeric ELSE $3::numeric END
         FROM formulas f
        WHERE f.id = fc.formula_id AND f.session_id = $1 AND f.scope = 'SESSAO' AND f.active = TRUE
          AND fc.type IN ('CRITERIOS', 'PAPEL')
       RETURNING fc.id;`,
        [session!.id, 7 * scale, 3 * scale],
      );
      expect(formulaComponents).toHaveLength(2);
      await dataSource.query(
        `INSERT INTO session_evaluation_configs
         (session_id, performance_table_id, table_name, created_by)
       VALUES ($1, $2, 'Tabela de teste', $3);`,
        [session!.id, tableId, ownerId],
      );
      await dataSource.query(
        `INSERT INTO session_evaluation_criteria
         (session_id, criterion_id, name, weight, order_index)
       SELECT $1, id, name, weight, order_index
         FROM performance_criteria
        WHERE id = ANY($2::uuid[]);`,
        [session!.id, [initialCriterion!.id, secondCriterion!.id]],
      );
      const [evaluation] = await dataSource.query<{ id: string }[]>(
        `INSERT INTO evaluations
         (evaluator_id, student_id, problem_id, session_id, config_session_id,
          performance_table_id, type, status, submitted_at, session_score,
          applied_bonus, calculation_version, created_by)
       VALUES ($1, $2, $3, $4, $4, $5, 'TUTOR_SESSION', 'SUBMITTED', now(), 6.4,
               5, 'WEIGHTED_SESSION_FORMULA_V3', $1)
       RETURNING id;`,
        [ownerId, studentId, problem!.id, session!.id, tableId],
      );
      await dataSource.query(
        `INSERT INTO evaluation_items (evaluation_id, criterion_id, score)
       VALUES ($1, $2, 8), ($1, $3, 6);`,
        [evaluation!.id, initialCriterion!.id, secondCriterion!.id],
      );

      await updateTable({
        nome: 'Outro nome',
        criterios: [
          { id: initialCriterion!.id, nome: 'Critério', ordem: 1, peso: 5 },
          { id: secondCriterion!.id, nome: 'Segundo critério', ordem: 2, peso: 5 },
        ],
      }).expect(400);

      const weightChanges = {
        nome: 'Tabela de teste',
        criterios: [
          { id: initialCriterion!.id, nome: 'Critério', ordem: 1, peso: 6 },
          { id: secondCriterion!.id, nome: 'Segundo critério', ordem: 2, peso: 4 },
        ],
      };
      await updateTable(weightChanges).expect(200);
      const [frozenCriterion] = await dataSource.query<{ weight: string }[]>(
        `SELECT weight FROM session_evaluation_criteria
        WHERE session_id = $1 AND criterion_id = $2;`,
        [session!.id, initialCriterion!.id],
      );
      const [unchangedEvaluation] = await dataSource.query<{ session_score: string }[]>(
        'SELECT session_score FROM evaluations WHERE id = $1;',
        [evaluation!.id],
      );
      expect(frozenCriterion!.weight).toBe('6.00');
      expect(unchangedEvaluation!.session_score).toBe('6.54');

      await updateTable({ ...weightChanges, propagarParaSessoes: true }).expect(200);
      const [propagatedCriterion] = await dataSource.query<{ weight: string }[]>(
        `SELECT weight FROM session_evaluation_criteria
        WHERE session_id = $1 AND criterion_id = $2;`,
        [session!.id, initialCriterion!.id],
      );
      const [recalculatedEvaluation] = await dataSource.query<{ session_score: string }[]>(
        'SELECT session_score FROM evaluations WHERE id = $1;',
        [evaluation!.id],
      );
      expect(propagatedCriterion!.weight).toBe('6.00');
      expect(recalculatedEvaluation!.session_score).toBe('6.54');
      const history = await dataSource.query<
        Array<{ previous_score: string; new_score: string; changed_by: string }>
      >(
        `SELECT previous_score, new_score, changed_by FROM grade_recalculation_history
        WHERE evaluation_id = $1;`,
        [evaluation!.id],
      );
      expect(history).toEqual([{ previous_score: '6.40', new_score: '6.54', changed_by: ownerId }]);
      const notices = await request(app.getHttpServer() as Server)
        .get('/api/avisos-notas')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      await request(app.getHttpServer() as Server)
        .get('/api/avisos-notas')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403);
      expect(notices.body).toContainEqual(
        expect.objectContaining({
          sessao: 'Sessão passada',
          notaAnterior: 6.4,
          notaAtualizada: 6.54,
          motivo: 'Nota recalculada devido à alteração dos pesos dos critérios de avaliação.',
        }),
      );
    },
  );

  it('rolls back table changes, archival and reordering when persistence fails', async () => {
    const repository = moduleRef.get<PerformanceTableRepository>(PERFORMANCE_TABLE_REPOSITORY);
    const [removed] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Removido', 2, 5) RETURNING id;`,
      [tableId],
    );
    const before = await readCriteria();
    const table = (await repository.findById(tableId))!;
    const retained = table.criteria.find((criterion) => criterion.id !== removed!.id)!;
    table.update({
      name: 'Não salvar',
      criteria: [
        { id: retained.id, name: 'Alterado', orderIndex: 2, weight: 5 },
        { name: 'Novo', orderIndex: 1, weight: 5 },
      ],
    });

    table.criteria[1]!.weight = 11;

    await expect(repository.update(table)).rejects.toThrow();
    expect(await readCriteria()).toEqual(before);
    expect((await repository.findById(tableId))!.name).toBe('Tabela de teste');
  });

  it('rechecks active ids after the initial read and does not restore removed criteria', async () => {
    const repository = moduleRef.get<PerformanceTableRepository>(PERFORMANCE_TABLE_REPOSITORY);
    const stale = (await repository.findById(tableId))!;
    const originalId = stale.criteria[0]!.id;
    await updateTable({
      nome: 'Configuração recente',
      criterios: [{ nome: 'Novo', peso: 10 }],
    }).expect(200);
    const before = await readCriteria();
    stale.update({
      name: 'Configuração antiga',
      criteria: [{ id: originalId, name: 'Antigo', weight: 10 }],
    });

    await expect(repository.update(stale)).rejects.toThrow(InvalidPerformanceTableError);
    expect(await readCriteria()).toEqual(before);
    expect((await repository.findById(tableId))!.name).toBe('Configuração recente');
  });

  it('rejects creating a table when the sum of criteria weights is not 10', async () => {
    const res = await request(app.getHttpServer() as Server)
      .post('/api/tabelas-desempenho')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        nome: 'Tabela Inválida',
        criterios: [
          { nome: 'Critério 1', peso: 4 },
          { nome: 'Critério 2', peso: 5 },
        ],
      })
      .expect(400);

    const body = res.body as ErrorResponseDto;
    expect(body.message).toContain('A soma dos pesos dos critérios deve ser igual a 10.');
  });

  it('rejects updating a table when the sum of criteria weights is not 10', async () => {
    const [original] = await readCriteria();
    const res = await updateTable({
      nome: 'Tabela Inválida',
      criterios: [{ id: original!.id, nome: 'Critério', peso: 7 }],
    }).expect(400);

    const body = res.body as ErrorResponseDto;
    expect(body.message).toContain('A soma dos pesos dos critérios deve ser igual a 10.');
  });
  it('rechecks past session usage inside the table update transaction', async () => {
    const repository = moduleRef.get<PerformanceTableRepository>(PERFORMANCE_TABLE_REPOSITORY);
    const table = (await repository.findById(tableId))!;
    table.update({
      name: 'Nome desatualizado',
      criteria: table.criteria.map((criterion) => ({
        id: criterion.id,
        name: criterion.name,
        description: criterion.description,
        orderIndex: criterion.orderIndex,
        weight: criterion.weight,
      })),
    });
    await dataSource.query(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
      SELECT id, $1, 'Sessão passada', CURRENT_DATE - 1, 1
        FROM problems ORDER BY created_at LIMIT 1;`,
      [tableId],
    );
    await expect(repository.update(table)).rejects.toThrow(InvalidPerformanceTableError);
    expect((await repository.findById(tableId))!.name).toBe('Tabela de teste');
  });
});
