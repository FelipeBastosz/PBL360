import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { DataSource } from 'typeorm';
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
});
