import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
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

interface ProblemTableReportBody {
  id: string;
  nomeArquivo: string;
  tipo: string;
  tamanho: number;
  categoria: string;
  enviadoPor: { id: string; nome: string };
  enviadoEm: string;
  sessaoId: string;
  sessao: {
    id: string;
    titulo: string;
    data: string;
    ordem: number;
  };
  urlDownload: string;
}

interface AttachmentBody {
  id: string;
  nomeArquivo: string;
}

interface OpenApiDocument {
  paths: Record<
    string,
    Record<
      string,
      {
        tags?: string[];
        summary?: string;
        security?: Array<Record<string, string[]>>;
        parameters?: Array<{ name: string; in: string; required?: boolean }>;
        responses: Record<string, unknown>;
      }
    >
  >;
  components: {
    schemas: Record<string, { properties?: Record<string, unknown> }>;
  };
}

const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

const pdf = (extra = 32, fill = 1) =>
  Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(extra, fill)]);

jest.setTimeout(60000);

describe('Problem table reports consolidated query (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerTutor: TestUser;
  let coTutor: TestUser;
  let unrelatedTutor: TestUser;
  let student: TestUser;
  let outsiderStudent: TestUser;
  let roomId: string;
  let otherRoomId: string;
  let problemId: string;
  let siblingProblemId: string;
  let otherRoomProblemId: string;

  const tableReportsPath = (targetRoomId = roomId, targetProblemId = problemId) =>
    `/salas/${targetRoomId}/problemas/${targetProblemId}/relatorios-mesa`;

  const createSession = async (
    targetRoomId: string,
    targetProblemId: string,
    titulo: string,
    data: string,
  ): Promise<string> => {
    const res = await api(app, ownerTutor)
      .post(`/salas/${targetRoomId}/problemas/${targetProblemId}/sessoes`, {
        titulo,
        descricao: null,
        data,
      })
      .expect(201);
    return (res.body as { id: string }).id;
  };

  const uploadAttachment = async (
    user: TestUser,
    sessionId: string,
    fileName: string,
    categoria: 'RELATORIO_MESA' | 'ANEXO_SESSAO',
    content: Buffer = pdf(),
  ): Promise<AttachmentBody> => {
    const res = await request(app.getHttpServer() as Server)
      .post(`/api/sessoes/${sessionId}/anexos`)
      .set('Authorization', `Bearer ${user.token}`)
      .attach('arquivo', content, { filename: fileName, contentType: 'application/pdf' })
      .field('categoria', categoria)
      .expect(201);
    return res.body as AttachmentBody;
  };

  const downloadBinary = (user: TestUser, path: string) =>
    api(app, user)
      .get(path)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      });

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    ownerTutor = await insertUser(app, dataSource, 'owner@uefs.br', UserType.TUTOR);
    coTutor = await insertUser(app, dataSource, 'cotutor@uefs.br', UserType.TUTOR);
    unrelatedTutor = await insertUser(app, dataSource, 'outsider-tutor@uefs.br', UserType.TUTOR);
    student = await insertUser(app, dataSource, '20240101@discente.uefs.br', UserType.STUDENT);
    outsiderStudent = await insertUser(
      app,
      dataSource,
      '20240102@discente.uefs.br',
      UserType.STUDENT,
    );

    await dataSource.query("UPDATE users SET name = 'Carlos Professor' WHERE id = $1;", [
      ownerTutor.id,
    ]);
    await dataSource.query("UPDATE users SET name = 'Ana Souza' WHERE id = $1;", [student.id]);

    const room = await api(app, ownerTutor)
      .post('/salas', {
        nome: 'MI Programação - TP01',
        codigoDisciplina: 'EXA863',
        semestre: '2026.2',
      })
      .expect(201);
    roomId = (room.body as { id: string }).id;

    const otherRoom = await api(app, ownerTutor)
      .post('/salas', {
        nome: 'MI Programação - TP02',
        codigoDisciplina: 'EXA864',
        semestre: '2026.2',
      })
      .expect(201);
    otherRoomId = (otherRoom.body as { id: string }).id;

    await insertDefaultPerformanceTable(dataSource, ownerTutor.id);

    await dataSource.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      roomId,
      coTutor.id,
    ]);
    await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      student.id,
    ]);

    const problem = await api(app, ownerTutor)
      .post(`/salas/${roomId}/problemas`, { titulo: 'Sistema de biblioteca' })
      .expect(201);
    problemId = (problem.body as { id: string }).id;

    const siblingProblem = await api(app, ownerTutor)
      .post(`/salas/${roomId}/problemas`, { titulo: 'Sistema de hospital' })
      .expect(201);
    siblingProblemId = (siblingProblem.body as { id: string }).id;

    const otherRoomProblem = await api(app, ownerTutor)
      .post(`/salas/${otherRoomId}/problemas`, { titulo: 'Problema de outra sala' })
      .expect(201);
    otherRoomProblemId = (otherRoomProblem.body as { id: string }).id;
  });

  describe('consolidation and metadata', () => {
    it('consolidates RELATORIO_MESA across multiple sessions with file, session, author, and download metadata', async () => {
      const session1 = await createSession(roomId, problemId, 'Abertura', '01-10-2026');
      const session2 = await createSession(roomId, problemId, 'Fechamento', '08-10-2026');
      const content1 = pdf(40, 1);
      const content2 = pdf(80, 2);

      const report1 = await uploadAttachment(
        student,
        session1,
        'Mesa_Abertura.pdf',
        'RELATORIO_MESA',
        content1,
      );
      const report2 = await uploadAttachment(
        ownerTutor,
        session2,
        'Mesa_Fechamento.pdf',
        'RELATORIO_MESA',
        content2,
      );

      for (const member of [ownerTutor, coTutor, student]) {
        const res = await api(app, member).get(tableReportsPath()).expect(200);
        const body = res.body as ProblemTableReportBody[];

        expect(body).toHaveLength(2);
        expect(body[0]).toMatchObject({
          id: report1.id,
          nomeArquivo: 'Mesa_Abertura.pdf',
          tipo: 'application/pdf',
          tamanho: content1.length,
          categoria: 'RELATORIO_MESA',
          enviadoPor: { id: student.id, nome: 'Ana Souza' },
          sessaoId: session1,
          sessao: {
            id: session1,
            titulo: 'Abertura',
            data: '01-10-2026',
            ordem: 1,
          },
          urlDownload: `/sessoes/${session1}/anexos/${report1.id}`,
        });
        expect(Number.isNaN(Date.parse(body[0].enviadoEm))).toBe(false);

        expect(body[1]).toMatchObject({
          id: report2.id,
          nomeArquivo: 'Mesa_Fechamento.pdf',
          tipo: 'application/pdf',
          tamanho: content2.length,
          categoria: 'RELATORIO_MESA',
          enviadoPor: { id: ownerTutor.id, nome: 'Carlos Professor' },
          sessaoId: session2,
          sessao: {
            id: session2,
            titulo: 'Fechamento',
            data: '08-10-2026',
            ordem: 2,
          },
          urlDownload: `/sessoes/${session2}/anexos/${report2.id}`,
        });
      }
    });
  });

  describe('empty lists and category filtering', () => {
    it('returns 200 with an empty array when the problem has no sessions', async () => {
      const res = await api(app, ownerTutor).get(tableReportsPath()).expect(200);
      expect(res.body).toEqual([]);
    });

    it('returns 200 with an empty array when sessions exist but have no RELATORIO_MESA attachments', async () => {
      const session1 = await createSession(roomId, problemId, 'Abertura', '01-10-2026');
      await uploadAttachment(student, session1, 'Relatorio_Mesa_Falso.pdf', 'ANEXO_SESSAO');

      const res = await api(app, student).get(tableReportsPath()).expect(200);
      expect(res.body).toEqual([]);
    });

    it('filters out ANEXO_SESSAO attachments from the same sessions', async () => {
      const session1 = await createSession(roomId, problemId, 'Abertura', '01-10-2026');
      const session2 = await createSession(roomId, problemId, 'Desenvolvimento', '05-10-2026');

      await uploadAttachment(student, session1, 'Anexo_Geral_1.pdf', 'ANEXO_SESSAO');
      const report1 = await uploadAttachment(
        student,
        session1,
        'Relatorio_S1.pdf',
        'RELATORIO_MESA',
      );
      await uploadAttachment(ownerTutor, session2, 'Anexo_Geral_2.pdf', 'ANEXO_SESSAO');
      const report2 = await uploadAttachment(
        ownerTutor,
        session2,
        'Relatorio_S2.pdf',
        'RELATORIO_MESA',
      );

      const res = await api(app, ownerTutor).get(tableReportsPath()).expect(200);
      const body = res.body as ProblemTableReportBody[];

      expect(body.map((item) => item.id)).toEqual([report1.id, report2.id]);
      expect(body.every((item) => item.categoria === 'RELATORIO_MESA')).toBe(true);
    });
  });

  describe('deterministic ordering', () => {
    it('orders by session date ASC, session order ASC, upload created_at DESC, and id DESC tie-breaker', async () => {
      // Create sessions out of chronological order to prove sorting uses session date, not creation order.
      const laterSession = await createSession(roomId, problemId, 'Fechamento', '15-10-2026');
      const earlierSession = await createSession(roomId, problemId, 'Abertura', '05-10-2026');
      const sameDateSecondSession = await createSession(
        roomId,
        problemId,
        'Abertura Parte 2',
        '05-10-2026',
      );

      const laterReport = await uploadAttachment(
        ownerTutor,
        laterSession,
        'Later.pdf',
        'RELATORIO_MESA',
      );
      const earlierOldest = await uploadAttachment(
        student,
        earlierSession,
        'Earlier_Oldest.pdf',
        'RELATORIO_MESA',
      );
      const earlierTiedA = await uploadAttachment(
        student,
        earlierSession,
        'Earlier_Tied_A.pdf',
        'RELATORIO_MESA',
      );
      const earlierTiedB = await uploadAttachment(
        ownerTutor,
        earlierSession,
        'Earlier_Tied_B.pdf',
        'RELATORIO_MESA',
      );
      const sameDateSecondReport = await uploadAttachment(
        ownerTutor,
        sameDateSecondSession,
        'SameDate_Second.pdf',
        'RELATORIO_MESA',
      );

      await dataSource.query('UPDATE session_attachments SET created_at = $1 WHERE id = $2;', [
        '2026-10-05T10:00:00.000Z',
        earlierOldest.id,
      ]);
      await dataSource.query(
        'UPDATE session_attachments SET created_at = $1 WHERE id IN ($2, $3);',
        ['2026-10-05T12:00:00.000Z', earlierTiedA.id, earlierTiedB.id],
      );

      const tiedOrdered = [earlierTiedA.id, earlierTiedB.id].sort((a, b) => b.localeCompare(a));

      const res = await api(app, ownerTutor).get(tableReportsPath()).expect(200);
      const body = res.body as ProblemTableReportBody[];

      expect(body.map((item) => item.id)).toEqual([
        tiedOrdered[0],
        tiedOrdered[1],
        earlierOldest.id,
        sameDateSecondReport.id,
        laterReport.id,
      ]);
    });
  });

  describe('isolation, anti-IDOR, and secure download reuse', () => {
    it('rejects unauthenticated requests with 401 and invalid UUIDs with 400', async () => {
      await api(app).get(tableReportsPath()).expect(401);
      await api(app, ownerTutor).get(tableReportsPath('not-a-uuid', problemId)).expect(400);
      await api(app, ownerTutor).get(tableReportsPath(roomId, 'not-a-uuid')).expect(400);
    });

    it('blocks non-members of the room with 403', async () => {
      await api(app, unrelatedTutor).get(tableReportsPath()).expect(403);
      await api(app, outsiderStudent).get(tableReportsPath()).expect(403);
    });

    it('rejects missing room, soft-deleted room, missing problem, and problem from another room with 404', async () => {
      const otherSession = await createSession(
        otherRoomId,
        otherRoomProblemId,
        'Outra Sessão',
        '02-10-2026',
      );
      await uploadAttachment(ownerTutor, otherSession, 'Outro_Relatorio.pdf', 'RELATORIO_MESA');

      await api(app, ownerTutor).get(tableReportsPath(UNKNOWN_UUID, problemId)).expect(404);
      await api(app, ownerTutor).get(tableReportsPath(roomId, UNKNOWN_UUID)).expect(404);
      await api(app, ownerTutor).get(tableReportsPath(roomId, otherRoomProblemId)).expect(404);

      await dataSource.query('UPDATE rooms SET deleted_at = now() WHERE id = $1;', [roomId]);
      await api(app, ownerTutor).get(tableReportsPath()).expect(404);
      await api(app, student).get(tableReportsPath()).expect(404);
    });

    it('does not leak table reports from other problems of the same room or from another room', async () => {
      const targetSession = await createSession(roomId, problemId, 'Alvo', '01-10-2026');
      const siblingSession = await createSession(roomId, siblingProblemId, 'Irmão', '02-10-2026');
      const otherRoomSession = await createSession(
        otherRoomId,
        otherRoomProblemId,
        'Outra Sala',
        '03-10-2026',
      );

      const targetReport = await uploadAttachment(
        student,
        targetSession,
        'Alvo.pdf',
        'RELATORIO_MESA',
      );
      await uploadAttachment(student, siblingSession, 'Irmao.pdf', 'RELATORIO_MESA');
      await uploadAttachment(ownerTutor, otherRoomSession, 'OutraSala.pdf', 'RELATORIO_MESA');

      const res = await api(app, ownerTutor).get(tableReportsPath()).expect(200);
      const body = res.body as ProblemTableReportBody[];

      expect(body.map((item) => item.id)).toEqual([targetReport.id]);
    });

    it('downloads listed table reports via existing route and blocks swapped session/problem/room contexts', async () => {
      const sessionA = await createSession(roomId, problemId, 'Sessão A', '01-10-2026');
      const sessionB = await createSession(roomId, problemId, 'Sessão B', '02-10-2026');
      const siblingSession = await createSession(roomId, siblingProblemId, 'Irmão', '03-10-2026');
      const otherRoomSession = await createSession(
        otherRoomId,
        otherRoomProblemId,
        'Outra Sala',
        '04-10-2026',
      );

      const contentA = pdf(64, 7);
      const reportA = await uploadAttachment(
        ownerTutor,
        sessionA,
        'Mesa_A.pdf',
        'RELATORIO_MESA',
        contentA,
      );
      const otherRoomReport = await uploadAttachment(
        ownerTutor,
        otherRoomSession,
        'Mesa_Outra_Sala.pdf',
        'RELATORIO_MESA',
        pdf(48, 9),
      );

      const listed = (await api(app, student).get(tableReportsPath()).expect(200))
        .body as ProblemTableReportBody[];
      expect(listed).toHaveLength(1);

      const downloaded = await downloadBinary(student, listed[0].urlDownload).expect(200);
      expect(downloaded.headers['content-type']).toBe('application/pdf');
      expect((downloaded.body as Buffer).equals(contentA)).toBe(true);

      // Swapped sessionId within same problem, sibling problem, or another room -> 404.
      await api(app, ownerTutor).get(`/sessoes/${sessionB}/anexos/${reportA.id}`).expect(404);
      await api(app, ownerTutor).get(`/sessoes/${siblingSession}/anexos/${reportA.id}`).expect(404);
      await api(app, ownerTutor)
        .get(`/sessoes/${otherRoomSession}/anexos/${reportA.id}`)
        .expect(404);
      await api(app, student).get(`/sessoes/${sessionA}/anexos/${otherRoomReport.id}`).expect(404);

      // Non-member trying to download directly -> 403.
      await api(app, outsiderStudent).get(listed[0].urlDownload).expect(403);
      await api(app, unrelatedTutor).get(listed[0].urlDownload).expect(403);
      await api(app, student)
        .get(`/sessoes/${otherRoomSession}/anexos/${otherRoomReport.id}`)
        .expect(403);

      // Soft-deleted room blocks direct download -> 404.
      await dataSource.query('UPDATE rooms SET deleted_at = now() WHERE id = $1;', [roomId]);
      await api(app, student).get(listed[0].urlDownload).expect(404);
    });
  });

  describe('Swagger OpenAPI documentation', () => {
    it('documents GET /api/salas/{salaId}/problemas/{problemaId}/relatorios-mesa and response schema', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/docs/json')
        .expect(200);
      const doc = response.body as OpenApiDocument;
      const routePath = '/api/salas/{salaId}/problemas/{problemaId}/relatorios-mesa';
      const operation = doc.paths[routePath]?.get;

      expect(operation).toBeDefined();
      expect(operation?.tags).toEqual(['Anexos da sessão']);
      expect(operation?.security).toEqual(expect.arrayContaining([{ jwt: [] }]));
      expect(operation?.parameters?.map((p) => p.name)).toEqual(
        expect.arrayContaining(['salaId', 'problemaId']),
      );
      expect(Object.keys(operation?.responses ?? {})).toEqual(
        expect.arrayContaining(['200', '400', '401', '403', '404']),
      );
      expect(
        Object.keys(doc.components.schemas.ProblemTableReportResponseDto?.properties ?? {}),
      ).toEqual([
        'id',
        'nomeArquivo',
        'tipo',
        'tamanho',
        'categoria',
        'enviadoPor',
        'enviadoEm',
        'sessaoId',
        'sessao',
        'urlDownload',
      ]);
      expect(
        Object.keys(doc.components.schemas.ProblemTableReportSessionDto?.properties ?? {}),
      ).toEqual(['id', 'titulo', 'data', 'ordem']);
    });
  });
});
