import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { SYSTEM_TABLE_IDS } from '@/performance-tables/domain/entities/system-performance-tables';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';
import { UserType } from '@/users/domain/enums/user-type.enum';

interface TableBody {
  id: string;
  nome: string;
  professorId: string | null;
  isDefault: boolean;
  criterios: Array<{ id: string; nome: string; peso: number; notaMaxima: number }>;
}

describe('System performance tables (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let tutor: TestUser, student: TestUser;
  let roomId: string, problemId: string;
  const path = () => `/salas/${roomId}/problemas/${problemId}/sessoes`;
  const create = async (date: string) => {
    const response = await api(app, tutor)
      .post(path(), { titulo: 'Sessão', descricao: null, data: date })
      .expect(201);
    return (response.body as { id: string }).id;
  };
  const assignment = async (id: string) => {
    const [row] = await db.query<[{ tableId: string; automatic: boolean }]>(
      'SELECT performance_table_id AS "tableId", uses_default_table AS automatic FROM sessions WHERE id = $1;',
      [id],
    );
    return row;
  };
  beforeAll(async () => {
    const fixture = await createTestApp();
    app = fixture.app;
    db = fixture.moduleRef.get(DataSource);
  });
  afterAll(async () => {
    try {
      await cleanDatabase(db);
    } finally {
      await app.close();
    }
  });
  beforeEach(async () => {
    await cleanDatabase(db);
    tutor = await insertUser(app, db, 'defaults@uefs.br');
    student = await insertUser(app, db, 'student@discente.uefs.br', UserType.STUDENT);
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala', 'EXA123', 'DEF34200', '2026.2', TRUE) RETURNING id;`,
      [tutor.id],
    );
    roomId = room.id;
    await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      student.id,
    ]);
    const [problem] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by)
       VALUES ($1, 'Problema', 1, $2) RETURNING id;`,
      [roomId, tutor.id],
    );
    problemId = problem.id;
  }, 30000);

  it('lists exactly two shared defaults and no personal default per tutor', async () => {
    const response = await api(app, tutor).get('/tabelas-desempenho').expect(200);
    expect((response.body as TableBody[]).map((table) => table.nome).sort()).toEqual([
      'Padrão',
      'Padrão da 1ª sessão',
    ]);
    for (const [id, weights] of [
      [SYSTEM_TABLE_IDS.standard, [4, 4, 2]],
      [SYSTEM_TABLE_IDS.firstSession, [8, 2]],
    ] as const) {
      const table = (await api(app, tutor).get(`/tabelas-desempenho/${id}`).expect(200))
        .body as TableBody;
      expect(table.professorId).toBeNull();
      expect(table.criterios.map((criterion) => criterion.peso)).toEqual(weights);
      expect(table.criterios.every((criterion) => criterion.notaMaxima === 10)).toBe(true);
    }
  });

  it('assigns different tables and the same 70/30 formula to first and second sessions', async () => {
    const first = await create('2099-11-10');
    const second = await create('2099-11-11');
    expect(await assignment(first)).toEqual({
      tableId: SYSTEM_TABLE_IDS.firstSession,
      automatic: true,
    });
    expect(await assignment(second)).toEqual({
      tableId: SYSTEM_TABLE_IDS.standard,
      automatic: true,
    });
    const formulas = await db.query<Array<{ sessionId: string; type: string; weight: string }>>(
      `SELECT f.session_id AS "sessionId", fc.type, fc.weight FROM formulas f
       JOIN formula_components fc ON fc.formula_id = f.id WHERE f.session_id IN ($1, $2) AND f.active = TRUE;`,
      [first, second],
    );
    for (const id of [first, second]) {
      expect(
        formulas
          .filter((row) => row.sessionId === id)
          .map((row) => [row.type, Number(row.weight)])
          .sort(),
      ).toEqual([
        ['CRITERIOS', 70],
        ['PAPEL', 30],
      ]);
    }
  });

  it('reassigns automatic tables when creating an earlier session and changing dates', async () => {
    const later = await create('2099-11-11');
    const earlier = await create('2099-11-10');
    expect((await assignment(later)).tableId).toBe(SYSTEM_TABLE_IDS.standard);
    expect((await assignment(earlier)).tableId).toBe(SYSTEM_TABLE_IDS.firstSession);
    await api(app, tutor)
      .put(`${path()}/${later}`, { titulo: 'Anterior', descricao: null, data: '2099-11-09' })
      .expect(200);
    expect((await assignment(later)).tableId).toBe(SYSTEM_TABLE_IDS.firstSession);
    expect((await assignment(earlier)).tableId).toBe(SYSTEM_TABLE_IDS.standard);
  });

  it.each([SYSTEM_TABLE_IDS.standard, SYSTEM_TABLE_IDS.firstSession])(
    'preserves an explicit copy of %s when dates are reordered',
    async (sourceId) => {
      const first = await create('2099-11-10');
      const second = await create('2099-11-11');
      await api(app, tutor).put(`/sessoes/${first}/tabela`, { tabelaId: sourceId }).expect(200);
      const selected = await assignment(first);
      expect(selected.automatic).toBe(false);
      expect(selected.tableId).not.toBe(sourceId);
      const [copy] = await db.query<
        Array<{
          tutorId: string;
          roomId: string;
          sourceId: string;
          isDefault: boolean;
          isSessionCopy: boolean;
        }>
      >(
        `SELECT tutor_id AS "tutorId", room_id AS "roomId", source_table_id AS "sourceId",
              is_default AS "isDefault", is_session_copy AS "isSessionCopy"
         FROM performance_tables WHERE id = $1;`,
        [selected.tableId],
      );
      expect(copy).toEqual({
        tutorId: tutor.id,
        roomId,
        sourceId,
        isDefault: false,
        isSessionCopy: true,
      });
      const source = (await api(app, tutor).get(`/tabelas-desempenho/${sourceId}`).expect(200))
        .body as TableBody;
      const copied = (
        await api(app, tutor).get(`/tabelas-desempenho/${selected.tableId}`).expect(200)
      ).body as TableBody;
      expect(copied.criterios.map(({ nome, peso }) => ({ nome, peso }))).toEqual(
        source.criterios.map(({ nome, peso }) => ({ nome, peso })),
      );
      expect(
        copied.criterios.every(
          (criterion) => !source.criterios.some((original) => original.id === criterion.id),
        ),
      ).toBe(true);
      await api(app, tutor)
        .put(`${path()}/${second}`, { titulo: 'Anterior', descricao: null, data: '2099-11-09' })
        .expect(200);
      expect(await assignment(first)).toEqual(selected);
      expect((await assignment(second)).tableId).toBe(SYSTEM_TABLE_IDS.firstSession);
    },
  );

  it('does not reassign tables after a draft evaluation exists', async () => {
    const first = await create('2099-11-10');
    const second = await create('2099-11-11');
    await api(app, tutor)
      .put(`/sessoes/${first}/avaliacoes/${student.id}`, { itens: [], enviar: false })
      .expect(200);
    await api(app, tutor)
      .put(`${path()}/${second}`, { titulo: 'Anterior', descricao: null, data: '2099-11-09' })
      .expect(200);
    expect((await assignment(first)).tableId).toBe(SYSTEM_TABLE_IDS.firstSession);
    expect((await assignment(second)).tableId).toBe(SYSTEM_TABLE_IDS.standard);
  });

  it('copies a default with independent IDs and blocks editing or deleting the original', async () => {
    const source = (
      await api(app, tutor).get(`/tabelas-desempenho/${SYSTEM_TABLE_IDS.standard}`).expect(200)
    ).body as TableBody;
    const copy = (
      await api(app, tutor)
        .post(`/tabelas-desempenho/${source.id}/copias`, { nome: 'Meu barema', salaId: roomId })
        .expect(201)
    ).body as TableBody;
    expect(copy).toMatchObject({ nome: 'Meu barema', professorId: tutor.id, isDefault: false });
    expect(copy.id).not.toBe(source.id);
    expect(
      copy.criterios.every((criterion) => !source.criterios.some((old) => old.id === criterion.id)),
    ).toBe(true);
    await api(app, tutor)
      .put(`/tabelas-desempenho/${copy.id}`, {
        nome: 'Barema personalizado',
        criterios: copy.criterios.map((criterion, index) => ({
          id: criterion.id,
          nome: criterion.nome,
          peso: criterion.peso,
          ordem: index + 1,
        })),
      })
      .expect(200);
    const changes = {
      nome: 'Outro nome',
      criterios: source.criterios.map((criterion, i) => ({
        id: criterion.id,
        nome: criterion.nome,
        peso: criterion.peso,
        ordem: i + 1,
      })),
    };
    await api(app, tutor).put(`/tabelas-desempenho/${source.id}`, changes).expect(403);
    await api(app, tutor).delete(`/tabelas-desempenho/${source.id}`).expect(403);
    await api(app, student).post(`/tabelas-desempenho/${source.id}/copias`).expect(403);
    const session = await create('2099-11-10');
    await api(app, tutor)
      .put(`/sessoes/${session}/tabela/edicao`, {
        escopo: 'TODAS',
        criterios: source.criterios.map(({ id, nome, peso }) => ({
          id,
          nome,
          peso,
        })),
      })
      .expect(403);
    const after = (await api(app, tutor).get(`/tabelas-desempenho/${source.id}`).expect(200))
      .body as TableBody;
    expect(after.criterios).toEqual(source.criterios);
  });

  it('documents copies and nullable system ownership', async () => {
    const doc = (await api(app).get('/docs/json').expect(200)).body as OpenAPIObject;
    expect(doc.paths['/api/tabelas-desempenho/{id}/copias']?.post?.responses['201']).toBeDefined();
    expect(doc.components?.schemas?.PerformanceTableResponseDto).toMatchObject({
      properties: { professorId: { nullable: true } },
    });
  });
});
