import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import {
  api,
  cleanDatabase,
  insertDefaultPerformanceTable,
  insertUser,
  type TestUser,
} from './helpers/fixtures';

interface HistoryItemBody {
  alunoId: string;
  notaAluno: number | null;
  notaAlunoOriginal: number | null;
  notaPares: number | null;
  avaliacoesPares: number;
  situacaoAjuste: string;
  origem: string | null;
}

interface DetailBody {
  planningPoker: {
    media: number | null;
    notaDecidida: number;
    notaVigente: number;
    ajustadaNaMesa: boolean;
    votos: Array<{ avaliadorId: string | null; nota: number }>;
  } | null;
  ajustes: Array<{ valorAnterior: number; valorNovo: number }>;
}

describe('Evaluation history with planning poker (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let tutor: TestUser;
  let ana: TestUser;
  let bruno: TestUser;
  let carla: TestUser;
  let sessionId: string;

  const pokerPath = (suffix = '') => `/sessoes/${sessionId}/poker${suffix}`;
  const historyPath = (studentId = '') =>
    `/sessoes/${sessionId}/historico-avaliacoes${studentId ? `/${studentId}` : ''}`;

  const decideRound = async (
    student: TestUser,
    voters: TestUser[],
    vote: number,
    decision: Record<string, unknown> = { acao: 'ACEITAR' },
  ) => {
    const opened = await api(app, tutor)
      .post(pokerPath('/rodadas'), { alunoId: student.id })
      .expect(201);
    const roundId = (opened.body as { rodadaId: string }).rodadaId;
    for (const voter of voters) {
      await api(app, voter)
        .put(pokerPath(`/rodadas/${roundId}/voto`), { nota: vote })
        .expect(200);
    }
    await api(app, tutor)
      .post(pokerPath(`/rodadas/${roundId}/revelar`))
      .expect(200);
    await api(app, tutor)
      .post(pokerPath(`/rodadas/${roundId}/decisao`), decision)
      .expect(200);
  };

  const history = async () =>
    (
      (await api(app, tutor).get(historyPath()).expect(200)).body as {
        alunos: HistoryItemBody[];
      }
    ).alunos;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    db = app.get(DataSource);
  });

  afterAll(async () => {
    await cleanDatabase(db);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
    tutor = await insertUser(app, db, 'history-poker-tutor@uefs.br');
    ana = await insertUser(app, db, 'hpana001@discente.uefs.br', UserType.STUDENT);
    bruno = await insertUser(app, db, 'hpbru002@discente.uefs.br', UserType.STUDENT);
    carla = await insertUser(app, db, 'hpcar003@discente.uefs.br', UserType.STUDENT);
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala histórico poker', 'EXA123', 'HPKR1234', '2026.2', true) RETURNING id;`,
      [tutor.id],
    );
    await db.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      room.id,
      tutor.id,
    ]);
    await db.query(
      'INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3), ($1, $4);',
      [room.id, ana.id, bruno.id, carla.id],
    );
    await insertDefaultPerformanceTable(db, tutor.id);
    const [problem] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by)
       VALUES ($1, 'Problema do histórico', 1, $2) RETURNING id;`,
      [room.id, tutor.id],
    );
    const [session] = await db.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, title, date, order_index, status)
       VALUES ($1, 'Sessão poker', '2026-10-12', 1, 'agendada') RETURNING id;`,
      [problem.id],
    );
    sessionId = session.id;
    await db.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status, seat_number)
       VALUES ($1, $2, $5, 'PRESENT', 1), ($1, $3, $5, 'PRESENT', 2), ($1, $4, $5, 'PRESENT', 3);`,
      [sessionId, ana.id, bruno.id, carla.id, tutor.id],
    );
    await api(app, tutor).post(pokerPath(), { anonimo: false, ordem: 'MANUAL' }).expect(201);
  });

  it('shows decided poker grades and keeps undecided students pending', async () => {
    await decideRound(ana, [bruno, carla], 8);
    await decideRound(bruno, [ana, carla], 6, {
      acao: 'REAJUSTAR',
      nota: 7.5,
      justificativa: 'Participação acima da média do grupo.',
    });

    const items = await history();

    expect(items.find((item) => item.alunoId === ana.id)).toMatchObject({
      notaAluno: null,
      notaAlunoOriginal: null,
      notaPares: 8,
      avaliacoesPares: 2,
      situacaoAjuste: 'SEM_AJUSTE',
      origem: 'PLANNING_POKER',
    });
    expect(items.find((item) => item.alunoId === bruno.id)).toMatchObject({
      notaAlunoOriginal: 6,
      notaPares: 7.5,
      situacaoAjuste: 'AJUSTADA',
      origem: 'PLANNING_POKER',
    });
    expect(items.find((item) => item.alunoId === carla.id)).toMatchObject({
      notaPares: null,
      situacaoAjuste: 'SEM_AJUSTE',
      origem: null,
    });
  });

  it('reflects tutor adjustments on the poker grade in the list and in the detail', async () => {
    await decideRound(ana, [bruno, carla], 8);
    const adjust = (novaNota: number) =>
      api(app, tutor)
        .post(`/sessoes/${sessionId}/autoavaliacoes/${ana.id}/ajustes`, {
          novaNota,
          justificativa: 'Nota revista após a sessão.',
          tipo: 'PARES',
        })
        .expect(200);
    await adjust(9);
    await adjust(8.5);

    const item = (await history()).find((entry) => entry.alunoId === ana.id);
    const detail = (await api(app, tutor).get(historyPath(ana.id)).expect(200)).body as DetailBody;

    expect(item).toMatchObject({
      notaAlunoOriginal: 8,
      notaPares: 8.5,
      situacaoAjuste: 'AJUSTADA',
      origem: 'PLANNING_POKER',
    });
    expect(detail.planningPoker).toMatchObject({
      media: 8,
      notaDecidida: 8,
      notaVigente: 8.5,
      ajustadaNaMesa: false,
      votos: [
        { avaliadorId: expect.any(String) as string, nota: 8 },
        { avaliadorId: expect.any(String) as string, nota: 8 },
      ],
    });
    expect(detail.ajustes.map((a) => [a.valorAnterior, a.valorNovo])).toEqual([
      [9, 8.5],
      [8, 9],
    ]);
  });

  it('returns no poker detail for a student without a decided round', async () => {
    const detail = (await api(app, tutor).get(historyPath(carla.id)).expect(200))
      .body as DetailBody;

    expect(detail.planningPoker).toBeNull();
    expect(detail.ajustes).toEqual([]);
  });
});
