import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
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
import { binaryParser, loadWorkbook } from './helpers/report-files';

interface SeatBody {
  lugar: number;
  alunoId: string | null;
  avaliado: boolean;
  votou: boolean;
}

interface RoundBody {
  rodadaId: string;
  numero: number;
  avaliado: { alunoId: string };
  mesa: SeatBody[];
  votantesEsperados: number;
}

interface StateBody {
  fila: string[];
  participante?: boolean;
  concluidas: Array<{ alunoId: string; notaFinal?: number; ajustada?: boolean }>;
  rodadaAtual: (RoundBody & { revelacao: unknown; souAvaliado?: boolean }) | null;
}

describe('Planning poker (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let tutor: TestUser;
  let outsider: TestUser;
  let ana: TestUser;
  let bruno: TestUser;
  let carla: TestUser;
  let absent: TestUser;
  let roomId: string;
  let problemId: string;
  let sessionId: string;

  const path = (suffix = '') => `/sessoes/${sessionId}/poker${suffix}`;
  const roundPath = (roundId: string, suffix = '') => path(`/rodadas/${roundId}${suffix}`);
  const start = (anonimo = false, ordem = 'SEQUENCIAL') =>
    api(app, tutor).post(path(), { anonimo, ordem });
  const openRound = async (alunoId?: string): Promise<RoundBody> =>
    (
      await api(app, tutor)
        .post(path('/rodadas'), alunoId ? { alunoId } : {})
        .expect(201)
    ).body as RoundBody;
  const vote = (user: TestUser, roundId: string, nota: number) =>
    api(app, user).put(roundPath(roundId, '/voto'), { nota });

  beforeAll(async () => {
    ({ app } = await createTestApp());
    db = app.get(DataSource);
    await app.listen(0);
  });

  afterAll(async () => {
    await cleanDatabase(db);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
    tutor = await insertUser(app, db, 'poker-tutor@uefs.br');
    outsider = await insertUser(app, db, 'poker-outsider@uefs.br');
    ana = await insertUser(app, db, 'poker-ana@discente.uefs.br', UserType.STUDENT);
    bruno = await insertUser(app, db, 'poker-bruno@discente.uefs.br', UserType.STUDENT);
    carla = await insertUser(app, db, 'poker-carla@discente.uefs.br', UserType.STUDENT);
    absent = await insertUser(app, db, 'poker-absent@discente.uefs.br', UserType.STUDENT);
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala do poker', 'EXA123', 'POKR1234', '2026.2', true) RETURNING id;`,
      [tutor.id],
    );
    roomId = room.id;
    await db.query(
      'INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3), ($1, $4), ($1, $5);',
      [room.id, ana.id, bruno.id, carla.id, absent.id],
    );
    await insertDefaultPerformanceTable(db, tutor.id);
    const [problem] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by)
       VALUES ($1, 'Dor torácica aguda', 1, $2) RETURNING id;`,
      [room.id, tutor.id],
    );
    problemId = problem.id;
    const [session] = await db.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, title, date, order_index, status)
       VALUES ($1, 'Sessão 3', '2026-10-12', 1, 'agendada') RETURNING id;`,
      [problem.id],
    );
    sessionId = session.id;
    await db.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status, seat_number)
       VALUES ($1, $2, $6, 'PRESENT', 1), ($1, $3, $6, 'LATE', 2), ($1, $4, $6, 'PRESENT', 3),
              ($1, $5, $6, 'ABSENT', NULL);`,
      [sessionId, ana.id, bruno.id, carla.id, absent.id, tutor.id],
    );
  });

  describe('starting', () => {
    it('queues the present and late students in table order', async () => {
      const response = await start().expect(201);

      expect((response.body as StateBody).fila).toEqual([ana.id, bruno.id, carla.id]);
    });

    it('requires the roll call to be saved', async () => {
      await db.query('DELETE FROM attendances WHERE session_id = $1;', [sessionId]);

      await start().expect(409);
    });

    it('refuses a second planning poker and a tutor outside the room', async () => {
      await start().expect(201);

      await start().expect(409);
      await api(app, outsider).post(path(), { anonimo: true, ordem: 'MANUAL' }).expect(403);
    });

    it('blocks the peer form once planning poker was used', async () => {
      await start().expect(201);

      await api(app, tutor)
        .put(`/sessoes/${sessionId}/liberacoes`, { pares: { liberada: true } })
        .expect(409);
    });

    it('reports why it cannot start', async () => {
      await db.query('DELETE FROM attendances WHERE session_id = $1;', [sessionId]);

      const response = await api(app, tutor).get(path('/disponibilidade')).expect(200);

      expect(response.body).toMatchObject({
        disponivel: false,
        motivo: 'Salve a chamada para começar.',
      });
    });

    it('blocks starting planning poker when tutor already submitted evaluations', async () => {
      await db.query(
        `INSERT INTO session_evaluation_configs (session_id, performance_table_id, table_name, created_by)
         VALUES ($1, (SELECT id FROM performance_tables LIMIT 1), 'Critérios', $2)
         ON CONFLICT (session_id) DO NOTHING;`,
        [sessionId, tutor.id],
      );
      await db.query(
        `INSERT INTO evaluations (session_id, student_id, evaluator_id, problem_id, performance_table_id, config_session_id, type, status, submitted_at, session_score, calculation_version, created_by)
         VALUES ($1, $2, $3, (SELECT problem_id FROM sessions WHERE id = $1), (SELECT performance_table_id FROM session_evaluation_configs WHERE session_id = $1), $1, 'TUTOR_SESSION', 'SUBMITTED', NOW(), 8.5, 'WEIGHTED_SESSION_FORMULA_V3', $3);`,
        [sessionId, ana.id, tutor.id],
      );

      const res = await start().expect(409);
      expect((res.body as { message: string }).message).toBe(
        'A sessão já possui avaliações do tutor submetidas.',
      );

      const availability = await api(app, tutor).get(path('/disponibilidade')).expect(200);
      expect(availability.body).toMatchObject({
        disponivel: false,
        motivo: 'A sessão já possui avaliações do tutor submetidas.',
      });
    });
  });

  describe('a round with names', () => {
    let round: RoundBody;

    beforeEach(async () => {
      await start().expect(201);
      round = await openRound();
    });

    it('opens the first student of the queue with the other students as voters', () => {
      expect(round.avaliado.alunoId).toBe(ana.id);
      expect(round.votantesEsperados).toBe(2);
      expect(round.mesa.map((seat) => seat.alunoId)).toEqual([ana.id, bruno.id, carla.id]);
    });

    it('lets voters vote and change the vote until the reveal', async () => {
      await vote(bruno, round.rodadaId, 7).expect(200);
      await vote(bruno, round.rodadaId, 8.5).expect(200, { votou: true, nota: 8.5 });
      await vote(carla, round.rodadaId, 9).expect(200);

      const reveal = await api(app, tutor).post(roundPath(round.rodadaId, '/revelar')).expect(200);

      expect(reveal.body).toMatchObject({ media: 8.75, totalVotos: 2, faltaram: 0 });
      await vote(carla, round.rodadaId, 5).expect(409);
    });

    it('forbids the evaluated student and absent students from voting', async () => {
      await vote(ana, round.rodadaId, 9).expect(403);
      await vote(absent, round.rodadaId, 9).expect(403);
    });

    it('rejects a score out of range or with more than two decimals', async () => {
      await vote(bruno, round.rodadaId, 10.5).expect(400);
      await vote(bruno, round.rodadaId, 8.555).expect(400);
    });

    it('refuses to accept a round without votes but allows an adjustment', async () => {
      await api(app, tutor).post(roundPath(round.rodadaId, '/revelar')).expect(200);
      const decide = (body: object) =>
        api(app, tutor).post(roundPath(round.rodadaId, '/decisao'), body);

      await decide({ acao: 'ACEITAR' }).expect(422);
      await decide({ acao: 'REAJUSTAR', nota: 8, justificativa: 'curta' }).expect(400);
      const adjusted = await decide({
        acao: 'REAJUSTAR',
        nota: 8,
        justificativa: 'Conduziu a síntese do grupo.',
      }).expect(200);

      expect(adjusted.body).toMatchObject({ notaFinal: 8, ajustada: true, decididoPor: tutor.id });
    });

    it('discards the votes when voting again', async () => {
      await vote(bruno, round.rodadaId, 7).expect(200);
      await api(app, tutor).post(roundPath(round.rodadaId, '/revelar')).expect(200);

      await api(app, tutor).post(roundPath(round.rodadaId, '/revotar')).expect(200);
      const state = (await api(app, bruno).get(path()).expect(200)).body as StateBody;

      expect(state.rodadaAtual?.revelacao).toBeNull();
      expect(state.rodadaAtual?.mesa.every((seat) => !seat.votou)).toBe(true);
    });

    it('records the accepted average and hides the final grade from students', async () => {
      await vote(bruno, round.rodadaId, 8).expect(200);
      await api(app, tutor).post(roundPath(round.rodadaId, '/revelar')).expect(200);
      await api(app, tutor)
        .post(roundPath(round.rodadaId, '/decisao'), { acao: 'ACEITAR' })
        .expect(200);

      const tutorState = (await api(app, tutor).get(path()).expect(200)).body as StateBody;
      const studentState = (await api(app, bruno).get(path()).expect(200)).body as StateBody;

      expect(tutorState.concluidas).toEqual([
        expect.objectContaining({ alunoId: ana.id, notaFinal: 8, ajustada: false }),
      ]);
      expect(studentState.concluidas[0]).not.toHaveProperty('notaFinal');
      expect(studentState.rodadaAtual).toBeNull();
    });

    it('puts a cancelled student back at the head of the queue', async () => {
      await api(app, tutor).delete(roundPath(round.rodadaId)).expect(204);

      const state = (await api(app, tutor).get(path()).expect(200)).body as StateBody;

      expect(state.fila).toEqual([ana.id, bruno.id, carla.id]);
    });
  });

  describe('decided grade in the session', () => {
    let round: RoundBody;

    const studentRow = (rows: unknown[][], student: TestUser) =>
      rows.find((values) => values.includes(student.email.slice(0, 8)));

    beforeEach(async () => {
      await start().expect(201);
      round = await openRound();
      await vote(bruno, round.rodadaId, 7).expect(200);
      await vote(carla, round.rodadaId, 8).expect(200);
      await api(app, tutor).post(roundPath(round.rodadaId, '/revelar')).expect(200);
      await api(app, tutor)
        .post(roundPath(round.rodadaId, '/decisao'), {
          acao: 'REAJUSTAR',
          nota: 8.75,
          justificativa: 'Participação ativa na discussão do problema.',
        })
        .expect(200);
    });

    it('keeps the decision with its author and justification and locks the round', async () => {
      const [decided] = await db.query<
        [{ status: string; final_grade: string; justification: string; decided_by: string }]
      >('SELECT status, final_grade, justification, decided_by FROM poker_rounds WHERE id = $1', [
        round.rodadaId,
      ]);

      expect(decided).toEqual({
        status: 'DECIDED',
        final_grade: '8.75',
        justification: 'Participação ativa na discussão do problema.',
        decided_by: tutor.id,
      });
      await vote(bruno, round.rodadaId, 10).expect(409);
    });

    it('uses the decided grade as the session grade', async () => {
      const grades = await api(app, tutor)
        .get(`/salas/${roomId}/problemas/${problemId}/notas`)
        .expect(200);
      const anaGrades = (
        grades.body as {
          alunos: Array<{ alunoId: string; sessoes: unknown[]; notaFinal: number | null }>;
        }
      ).alunos.find((aluno) => aluno.alunoId === ana.id);

      expect(anaGrades?.sessoes[0]).toMatchObject({
        sessaoId: sessionId,
        nota: 8.8,
        situacao: 'AVALIADA',
        modalidade: 'PARES',
        pares: { nota: 8.8, situacao: 'AVALIADA', origem: 'PLANNING_POKER' },
      });
      expect(anaGrades?.notaFinal).toBe(8.8);
    });

    it('exports the decided grade with one decimal place in the session report', async () => {
      const res = await api(app, tutor)
        .get(`/sessoes/${sessionId}/relatorio/exportacao?formato=XLSX`)
        .buffer(true)
        .parse(binaryParser)
        .expect(200);

      const sheet = (await loadWorkbook(res.body)).getWorksheet('Dados da sessão')!;
      const rows: unknown[][] = [];
      sheet.eachRow((row) => rows.push(row.values as unknown[]));

      expect(studentRow(rows, ana)?.slice(-2)).toEqual(['Nota enviada', 8.8]);
      expect(studentRow(rows, bruno)?.slice(-1)).toEqual(['Não registrada']);
    });
  });

  describe('queue and closing', () => {
    it('lets the tutor reorder the sequential queue', async () => {
      await start().expect(201);

      await api(app, tutor)
        .put(path('/fila'), { fila: [carla.id, ana.id, bruno.id] })
        .expect(200);
      const round = await openRound();

      expect(round.avaliado.alunoId).toBe(carla.id);
      await api(app, tutor)
        .put(path('/fila'), { fila: [ana.id] })
        .expect(422);
    });

    it('requires choosing the student in manual mode', async () => {
      await start(false, 'MANUAL').expect(201);

      await api(app, tutor).post(path('/rodadas'), {}).expect(400);
      expect((await openRound(bruno.id)).avaliado.alunoId).toBe(bruno.id);
    });

    it('closes listing the students left without a grade', async () => {
      await start().expect(201);

      const closed = await api(app, tutor).post(path('/encerrar')).expect(200);

      expect(closed.body).toMatchObject({ avaliados: 0, resultados: [] });
      expect((closed.body as { naoAvaliados: unknown[] }).naoAvaliados).toHaveLength(3);
      await api(app, tutor).get(path()).expect(404);
    });
  });

  describe('anonymous mode', () => {
    it('never links a vote to its voter, not even for the tutor', async () => {
      await start(true).expect(201);
      const round = await openRound();
      await vote(bruno, round.rodadaId, 7).expect(200);
      await vote(carla, round.rodadaId, 9).expect(200);
      const reveal = await api(app, tutor).post(roundPath(round.rodadaId, '/revelar')).expect(200);
      const tutorState = await api(app, tutor).get(path()).expect(200);
      const studentState = await api(app, carla).get(path()).expect(200);

      for (const body of [
        reveal.body,
        (tutorState.body as StateBody).rodadaAtual,
        (studentState.body as StateBody).rodadaAtual,
      ]) {
        expect(JSON.stringify(body)).not.toContain(bruno.id);
      }
      expect(JSON.stringify(reveal.body)).not.toContain(carla.id);
    });
  });

  describe('realtime channel', () => {
    const sockets: Socket[] = [];
    const connect = (user: TestUser | null): Socket => {
      const { port } = (app.getHttpServer() as Server).address() as AddressInfo;
      const socket = io(`http://127.0.0.1:${port}/poker`, {
        auth: { token: user?.token, sessaoId: sessionId },
        transports: ['websocket'],
        reconnection: false,
      });
      sockets.push(socket);
      return socket;
    };
    const next = <T>(socket: Socket, event: string) =>
      new Promise<T>((resolve) => socket.once(event, (payload: T) => resolve(payload)));
    const connected = (socket: Socket) => next(socket, 'poker.conectado');

    afterEach(() => sockets.splice(0).forEach((socket) => socket.disconnect()));

    it('refuses connections without a valid token or from absent students', async () => {
      const anonymous = connect(null);
      const missing = connect(absent);

      await expect(next(anonymous, 'poker.erro')).resolves.toBeDefined();
      await expect(next<{ mensagem: string }>(missing, 'poker.erro')).resolves.toEqual({
        mensagem: 'Você não participou desta sessão.',
      });
    });

    it('delivers the events in order and filters what each profile can see', async () => {
      const tutorSocket = connect(tutor);
      const studentSocket = connect(bruno);
      await Promise.all([connected(tutorSocket), connected(studentSocket)]);
      await start().expect(201);

      const opened = next<{ rodadaId: string }>(studentSocket, 'poker.rodada_aberta');
      const round = await openRound();
      expect((await opened).rodadaId).toBe(round.rodadaId);

      const voted = next<Record<string, unknown>>(tutorSocket, 'poker.voto_registrado');
      await vote(bruno, round.rodadaId, 8).expect(200);
      expect(await voted).toEqual({
        rodadaId: round.rodadaId,
        votaram: 1,
        esperados: 2,
        lugaresQueVotaram: [2],
      });

      await api(app, tutor).post(roundPath(round.rodadaId, '/revelar')).expect(200);
      const tutorDecided = next(tutorSocket, 'poker.decidida');
      const studentDecided = next(studentSocket, 'poker.decidida');
      await api(app, tutor)
        .post(roundPath(round.rodadaId, '/decisao'), { acao: 'ACEITAR' })
        .expect(200);

      expect(await tutorDecided).toEqual({
        rodadaId: round.rodadaId,
        notaFinal: 8,
        ajustada: false,
      });
      expect(await studentDecided).toEqual({ rodadaId: round.rodadaId });
    });
  });
});
