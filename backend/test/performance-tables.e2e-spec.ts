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
      `INSERT INTO performance_tables (tutor_id, name) VALUES ($1, 'Tabela de teste') RETURNING id;`,
      [ownerId],
    );
    tableId = table.id;
    await dataSource.query(
      `INSERT INTO performance_criteria (performance_table_id, name) VALUES ($1, 'Critério');`,
      [tableId],
    );
    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala', 'EXA123', 'ROOM1234', '2026.2', true) RETURNING id;`,
      [ownerId],
    );
    await dataSource.query(
      `INSERT INTO problems (room_id, title, created_by, performance_table_id)
       VALUES ($1, 'Problema vinculado', $2, $3);`,
      [room.id, ownerId, tableId],
    );
    ownerToken = signAccessToken(app, ownerId, 'owner@uefs.br', UserType.TUTOR);
    otherTutorToken = signAccessToken(app, otherTutorId, 'other@uefs.br', UserType.TUTOR);
    studentToken = signAccessToken(app, studentId, 'aluno@discente.uefs.br', UserType.STUDENT);
  });

  const deleteTable = (token: string) =>
    request(app.getHttpServer() as Server)
      .delete(`/api/tabelas-desempenho/${tableId}`)
      .set('Authorization', `Bearer ${token}`);

  const getTable = (id: string, token: string) =>
    request(app.getHttpServer() as Server)
      .get(`/api/tabelas-desempenho/${id}`)
      .set('Authorization', `Bearer ${token}`);

  it('retrieves performance table with criteria sorted by order_index and linked problems count', async () => {
    await dataSource.query('DELETE FROM performance_criteria WHERE performance_table_id = $1;', [
      tableId,
    ]);
    await dataSource.query(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Segundo Critério', 2, 5), ($1, 'Primeiro Critério', 1, 3);`,
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
      peso: 5,
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

  it('soft deletes only the table and preserves criteria and linked problems', async () => {
    await deleteTable(ownerToken).expect(204);

    const [table] = await dataSource.query<{ deleted_at: Date | null }[]>(
      'SELECT deleted_at FROM performance_tables WHERE id = $1;',
      [tableId],
    );
    const [criteria] = await dataSource.query<{ count: number }[]>(
      'SELECT COUNT(*)::int AS count FROM performance_criteria WHERE performance_table_id = $1;',
      [tableId],
    );
    const [problems] = await dataSource.query<{ count: number }[]>(
      'SELECT COUNT(*)::int AS count FROM problems WHERE performance_table_id = $1;',
      [tableId],
    );

    if (!table || !criteria || !problems) {
      throw new Error('Expected table, criterion, and problem rows.');
    }

    expect(table.deleted_at).not.toBeNull();
    expect(criteria.count).toBe(1);
    expect(problems.count).toBe(1);
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
        { id: original!.id, nome: 'Participação', peso: 3, ordem: 1 },
        { nome: 'Evolução', peso: 2, ordem: 2 },
      ],
    }).expect(200);
    const body = response.body as PerformanceTableResponseDto;
    const rows = await readCriteria();

    expect(body.nome).toBe('Tabela atualizada');
    expect(body.descricao).toBeNull();
    expect(body.criterios).toHaveLength(2);
    expect(body.criterios[0]).toMatchObject({ id: original!.id, nome: 'Participação', peso: 3 });
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
      `INSERT INTO performance_criteria (performance_table_id, name, order_index)
       VALUES ($1, 'Autonomia', 2) RETURNING id;`,
      [tableId],
    );

    await updateTable({
      nome: 'Tabela',
      criterios: [{ id: retained!.id, nome: 'Participação' }],
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
      criterios: [{ nome: 'Evolução' }],
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
      `INSERT INTO performance_criteria (performance_table_id, name, order_index)
       VALUES ($1, 'Segundo', 2) RETURNING id;`,
      [tableId],
    );
    const response = await updateTable({
      nome: 'Tabela',
      criterios: [
        { id: first!.id, nome: 'Primeiro', ordem: 2 },
        { id: second!.id, nome: 'Segundo', ordem: 1 },
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
        { id: before[0]!.id, nome: 'Primeiro', ordem: 1 },
        { id: before[0]!.id, nome: 'Segundo', ordem: 2 },
      ],
    }).expect(400);

    expect(await readCriteria()).toEqual(before);
    const response = await getTable(tableId, ownerToken).expect(200);
    expect((response.body as PerformanceTableResponseDto).nome).toBe('Tabela de teste');
  });

  it('rejects criterion ids from another table', async () => {
    const [otherTable] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO performance_tables (tutor_id, name) VALUES ($1, 'Outra tabela') RETURNING id;`,
      [otherTutorId],
    );
    const [foreign] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name)
       VALUES ($1, 'Outro critério') RETURNING id;`,
      [otherTable!.id],
    );
    const before = await readCriteria();
    await updateTable({
      nome: 'Tabela',
      criterios: [{ id: foreign!.id, nome: 'Alterado' }],
    }).expect(400);
    expect(await readCriteria()).toEqual(before);
  });

  it('does not reactivate a previously archived criterion', async () => {
    const [original] = await readCriteria();
    await updateTable({ nome: 'Tabela', criterios: [{ nome: 'Novo' }] }).expect(200);
    const before = await readCriteria();

    await updateTable({ nome: 'Tabela', criterios: [{ id: original!.id, nome: 'Antigo' }] }).expect(
      400,
    );
    expect(await readCriteria()).toEqual(before);
  });

  it('rejects removal of the last criterion', async () => {
    const before = await readCriteria();
    await updateTable({ nome: 'Tabela', criterios: [] }).expect(400);
    expect(await readCriteria()).toEqual(before);
  });

  it('requires ownership and the tutor role to update a table', async () => {
    const before = await readCriteria();
    const payload = { nome: 'Tabela', criterios: [{ nome: 'Novo' }] };
    await updateTable(payload, otherTutorToken).expect(403);
    await updateTable(payload, studentToken).expect(403);
    expect(await readCriteria()).toEqual(before);
  });

  it('rolls back table changes, archival and reordering when persistence fails', async () => {
    const repository = moduleRef.get<PerformanceTableRepository>(PERFORMANCE_TABLE_REPOSITORY);
    const [removed] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index)
       VALUES ($1, 'Removido', 2) RETURNING id;`,
      [tableId],
    );
    const before = await readCriteria();
    const table = (await repository.findById(tableId))!;
    const retained = table.criteria.find((criterion) => criterion.id !== removed!.id)!;
    table.update({
      name: 'Não salvar',
      criteria: [
        { id: retained.id, name: 'Alterado', orderIndex: 2 },
        { name: 'Novo', orderIndex: 1 },
      ],
    });
    // Bypass domain validation to force a database constraint failure after earlier writes.
    table.criteria[1]!.weight = 11;

    await expect(repository.update(table)).rejects.toThrow();
    expect(await readCriteria()).toEqual(before);
    expect((await repository.findById(tableId))!.name).toBe('Tabela de teste');
  });

  it('rechecks active ids after the initial read and does not restore removed criteria', async () => {
    const repository = moduleRef.get<PerformanceTableRepository>(PERFORMANCE_TABLE_REPOSITORY);
    const stale = (await repository.findById(tableId))!;
    const originalId = stale.criteria[0]!.id;
    await updateTable({ nome: 'Configuração recente', criterios: [{ nome: 'Novo' }] }).expect(200);
    const before = await readCriteria();
    stale.update({ name: 'Configuração antiga', criteria: [{ id: originalId, name: 'Antigo' }] });

    await expect(repository.update(stale)).rejects.toThrow(InvalidPerformanceTableError);
    expect(await readCriteria()).toEqual(before);
    expect((await repository.findById(tableId))!.name).toBe('Configuração recente');
  });
});
