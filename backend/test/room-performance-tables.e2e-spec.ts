import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, signAccessToken } from './helpers/fixtures';

interface RoomPerformanceTableResponseItem {
  id: string;
  nome: string;
  descricao: string | null;
  origem: 'TURMA' | 'PESSOAL' | 'PADRAO';
  autor: { id: string; nome: string };
  criterios: Array<{
    id: string;
    nome: string;
    descricao: string | null;
    ordem: number;
    peso: number;
  }>;
  emUso: number;
}

describe('Room Performance Tables (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let ownerId: string;
  let coTutorId: string;
  let otherTutorId: string;
  let studentId: string;

  let ownerToken: string;
  let coTutorToken: string;
  let otherTutorToken: string;
  let studentToken: string;

  let roomId: string;
  let defaultTableId: string;
  let ownerPersonalTableId: string;
  let coTutorPersonalTableId: string;

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

    // 1. Criar usuários
    const [owner] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Carlos Mendes', 'carlos.tutor@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    ownerId = owner.id;

    const [coTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Maria Santos', 'maria.cotutor@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    coTutorId = coTutor.id;

    const [otherTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Lucas Silva', 'lucas.other@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    otherTutorId = otherTutor.id;

    const [student] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Pedro Aluno', 'pedro.student@uefs.br', 'hash', $1, '20261010', true)
       RETURNING id;`,
      [UserType.STUDENT],
    );
    studentId = student.id;

    ownerToken = signAccessToken(app, ownerId, 'carlos.tutor@uefs.br', UserType.TUTOR);
    coTutorToken = signAccessToken(app, coTutorId, 'maria.cotutor@uefs.br', UserType.TUTOR);
    otherTutorToken = signAccessToken(app, otherTutorId, 'lucas.other@uefs.br', UserType.TUTOR);
    studentToken = signAccessToken(app, studentId, 'pedro.student@uefs.br', UserType.STUDENT);

    // 2. Criar sala e vincular co-tutor
    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Engenharia de Software', 'EXA123', 'ROOM336A', '2026.2', true)
       RETURNING id;`,
      [ownerId],
    );
    roomId = room.id;

    await dataSource.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      roomId,
      coTutorId,
    ]);

    // 3. Criar tabela padrão do sistema (PADRAO)
    const [defaultTable] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default)
       VALUES ($1, 'Barema Geral do Sistema', true)
       RETURNING id;`,
      [ownerId],
    );
    defaultTableId = defaultTable.id;

    await dataSource.query(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Critério Geral 1', 1, 10);`,
      [defaultTableId],
    );

    // 4. Criar tabela pessoal de Carlos (PESSOAL - sem room_id)
    const [ownerPersonal] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default)
       VALUES ($1, 'Barema Pessoal do Carlos', false)
       RETURNING id;`,
      [ownerId],
    );
    ownerPersonalTableId = ownerPersonal.id;

    await dataSource.query(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Critério Pessoal Carlos', 1, 10);`,
      [ownerPersonalTableId],
    );

    // 5. Criar tabela pessoal de Maria (PESSOAL - sem room_id)
    const [coTutorPersonal] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default)
       VALUES ($1, 'Barema Pessoal da Maria', false)
       RETURNING id;`,
      [coTutorId],
    );
    coTutorPersonalTableId = coTutorPersonal.id;

    await dataSource.query(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Critério Pessoal Maria', 1, 10);`,
      [coTutorPersonalTableId],
    );
  });

  it('completes the full shared room performance tables lifecycle (MEL02.1)', async () => {
    // -----------------------------------------------------------------
    // 1. Criar tabela vinculada à sala via POST /salas/:salaId/tabelas-desempenho
    // -----------------------------------------------------------------
    const createRes = await server()
      .post(`/api/salas/${roomId}/tabelas-desempenho`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        nome: 'Barema do Módulo 1 (Turma)',
        descricao: 'Barema específico criado para a turma',
        criterios: [
          { nome: 'Domínio Técnico', ordem: 1, peso: 6 },
          { nome: 'Colaboração', ordem: 2, peso: 4 },
        ],
      })
      .expect(201);

    const createdBody = createRes.body as { id: string; nome: string };
    const roomTableId = createdBody.id;
    expect(roomTableId).toBeDefined();
    expect(createdBody.nome).toBe('Barema do Módulo 1 (Turma)');

    // Verificar que room_id foi persistido corretamente no banco
    const [persistedTable] = await dataSource.query<[{ room_id: string }]>(
      `SELECT room_id FROM performance_tables WHERE id = $1;`,
      [roomTableId],
    );
    expect(persistedTable.room_id).toBe(roomId);

    // -----------------------------------------------------------------
    // 2. Co-tutor Maria recém-adicionada lista tabelas da turma
    // -----------------------------------------------------------------
    const listRes = await server()
      .get(`/api/salas/${roomId}/tabelas-desempenho`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .expect(200);

    const tables = listRes.body as RoomPerformanceTableResponseItem[];

    // Maria deve ver:
    // a) A tabela da turma criada por Carlos (origem: TURMA, autor: Carlos)
    // b) Sua própria tabela pessoal (origem: PESSOAL, autor: Maria)
    // c) A tabela padrão do sistema (origem: PADRAO)
    // E NÃO deve ver a tabela pessoal de Carlos!
    expect(tables).toHaveLength(3);

    const roomTable = tables.find((t) => t.id === roomTableId);
    expect(roomTable).toBeDefined();
    expect(roomTable?.origem).toBe('TURMA');
    expect(roomTable?.autor.id).toBe(ownerId);
    expect(roomTable?.autor.nome).toBe('Carlos Mendes');
    expect(roomTable?.emUso).toBe(0);
    expect(roomTable?.criterios).toHaveLength(2);

    const mariaPersonal = tables.find((t) => t.id === coTutorPersonalTableId);
    expect(mariaPersonal).toBeDefined();
    expect(mariaPersonal?.origem).toBe('PESSOAL');
    expect(mariaPersonal?.autor.id).toBe(coTutorId);
    expect(mariaPersonal?.autor.nome).toBe('Maria Santos');

    const defaultTable = tables.find((t) => t.id === defaultTableId);
    expect(defaultTable).toBeDefined();
    expect(defaultTable?.origem).toBe('PADRAO');

    const carlosPersonal = tables.find((t) => t.id === ownerPersonalTableId);
    expect(carlosPersonal).toBeUndefined(); // Tabela pessoal de outro tutor não deve aparecer

    // -----------------------------------------------------------------
    // 3. Vincular a tabela da turma a um problema com 2 sessões e verificar emUso
    // -----------------------------------------------------------------
    const [problem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 1', 'Descrição', 1, $2)
       RETURNING id;`,
      [roomId, coTutorId],
    );

    await dataSource.query(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index, status)
       VALUES ($1, $2, 'Sessão 1', '2026-10-01', 1, 'concluida'),
              ($1, $2, 'Sessão 2', '2026-10-08', 2, 'agendada');`,
      [problem.id, roomTableId],
    );

    const listResAfterUsage = await server()
      .get(`/api/salas/${roomId}/tabelas-desempenho`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .expect(200);

    const updatedRoomTable = (listResAfterUsage.body as RoomPerformanceTableResponseItem[]).find(
      (t) => t.id === roomTableId,
    );
    expect(updatedRoomTable?.emUso).toBe(2);

    // -----------------------------------------------------------------
    // 4. Co-tutor Maria edita a tabela da turma
    // -----------------------------------------------------------------
    await server()
      .put(`/api/tabelas-desempenho/${roomTableId}`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .send({
        nome: 'Barema do Módulo 1 (Revisado pela Co-tutora)',
        descricao: 'Nova descrição',
        criterios: [
          { id: roomTable?.criterios[0]?.id, nome: 'Domínio Técnico Aprofundado', peso: 7 },
          { id: roomTable?.criterios[1]?.id, nome: 'Colaboração e Liderança', peso: 3 },
        ],
      })
      .expect(200);

    const [updatedInDb] = await dataSource.query<[{ name: string }]>(
      `SELECT name FROM performance_tables WHERE id = $1;`,
      [roomTableId],
    );
    expect(updatedInDb.name).toBe('Barema do Módulo 1 (Revisado pela Co-tutora)');

    // -----------------------------------------------------------------
    // 5. Co-tutor Maria tenta excluir a tabela criada por Carlos -> 403 Forbidden
    // -----------------------------------------------------------------
    await server()
      .delete(`/api/tabelas-desempenho/${roomTableId}`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .expect(403);

    // -----------------------------------------------------------------
    // 6. Carlos exclui uma tabela de turma própria -> 204 No Content
    // -----------------------------------------------------------------
    const tempTableRes = await server()
      .post(`/api/salas/${roomId}/tabelas-desempenho`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        nome: 'Tabela Temporária para Exclusão',
        criterios: [{ nome: 'Critério Único', ordem: 1, peso: 10 }],
      })
      .expect(201);
    const tempTableId = (tempTableRes.body as { id: string }).id;

    await server()
      .delete(`/api/tabelas-desempenho/${tempTableId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    // -----------------------------------------------------------------
    // 7. Remover Co-tutor Maria da turma -> deixa de ter acesso às tabelas da turma
    // -----------------------------------------------------------------
    await dataSource.query(`DELETE FROM room_tutors WHERE room_id = $1 AND tutor_id = $2;`, [
      roomId,
      coTutorId,
    ]);

    await server()
      .get(`/api/salas/${roomId}/tabelas-desempenho`)
      .set('Authorization', `Bearer ${coTutorToken}`)
      .expect(403);

    // Carlos continua vendo as tabelas da turma
    const ownerListRes = await server()
      .get(`/api/salas/${roomId}/tabelas-desempenho`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const ownerTables = ownerListRes.body as RoomPerformanceTableResponseItem[];
    expect(ownerTables.some((t) => t.id === roomTableId)).toBe(true);

    // -----------------------------------------------------------------
    // 8. Validações de controle de acesso (Aluno e Tutor de outra turma)
    // -----------------------------------------------------------------
    await server()
      .get(`/api/salas/${roomId}/tabelas-desempenho`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);

    await server()
      .get(`/api/salas/${roomId}/tabelas-desempenho`)
      .set('Authorization', `Bearer ${otherTutorToken}`)
      .expect(403);

    await server()
      .post(`/api/salas/${roomId}/tabelas-desempenho`)
      .set('Authorization', `Bearer ${otherTutorToken}`)
      .send({
        nome: 'Barema Inválido',
        criterios: [{ nome: 'Critério', ordem: 1, peso: 10 }],
      })
      .expect(403);
  });
});
