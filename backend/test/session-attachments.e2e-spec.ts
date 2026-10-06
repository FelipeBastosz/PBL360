import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface AttachmentBody {
  id: string;
  nomeArquivo: string;
  tipo: string;
  tamanho: number;
  enviadoPor: { id: string; nome: string };
  enviadoEm: string;
}

interface ErrorBody {
  message: string | string[];
}

const MAX_BYTES = 10 * 1024 * 1024;

const pdf = (extra = 32) => Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(extra, 1)]);

jest.setTimeout(60000);

describe('Session attachments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let tutor: TestUser;
  let student: TestUser;
  let stranger: TestUser;
  let roomId: string;
  let sessionId: string;

  const attachmentsPath = () => `/sessoes/${sessionId}/anexos`;

  const multipart = (user: TestUser) =>
    request(app.getHttpServer() as Server)
      .post(`/api${attachmentsPath()}`)
      .set('Authorization', `Bearer ${user.token}`);

  const upload = (
    user: TestUser,
    content: Buffer,
    fileName = 'Relatório Parcial.pdf',
    field = 'arquivo',
  ) =>
    multipart(user).attach(field, content, { filename: fileName, contentType: 'application/pdf' });

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
    tutor = await insertUser(app, dataSource, 'carlos@uefs.br');
    student = await insertUser(app, dataSource, '20240101@discente.uefs.br', UserType.STUDENT);
    stranger = await insertUser(app, dataSource, '20240102@discente.uefs.br', UserType.STUDENT);
    await dataSource.query("UPDATE users SET name = 'Ana Souza' WHERE id = $1;", [student.id]);
    const room = await api(app, tutor)
      .post('/salas', {
        nome: 'MI Programação - TP01',
        codigoDisciplina: 'EXA863',
        semestre: '2026.2',
      })
      .expect(201);
    roomId = (room.body as { id: string }).id;
    await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      student.id,
    ]);
    const problem = await api(app, tutor)
      .post(`/salas/${roomId}/problemas`, { titulo: 'Sistema de biblioteca' })
      .expect(201);
    const problemId = (problem.body as { id: string }).id;
    const session = await api(app, tutor)
      .post(`/salas/${roomId}/problemas/${problemId}/sessoes`, {
        titulo: 'Abertura',
        descricao: null,
        data: '2026-10-01',
      })
      .expect(201);
    sessionId = (session.body as { id: string }).id;
  });

  describe('room members reading sessions', () => {
    it('lets an enrolled student list the room sessions with their problem', async () => {
      const response = await api(app, student).get(`/salas/${roomId}/sessoes`).expect(200);

      expect(response.body).toEqual([
        expect.objectContaining({
          id: sessionId,
          titulo: 'Abertura',
          data: '2026-10-01',
          problemaTitulo: 'Sistema de biblioteca',
        }),
      ]);
    });

    it('lets an enrolled student open a session', async () => {
      const response = await api(app, student).get(`/sessoes/${sessionId}`).expect(200);

      expect(response.body).toMatchObject({
        id: sessionId,
        salaId: roomId,
        problemaTitulo: 'Sistema de biblioteca',
      });
    });

    it('keeps a student who is not enrolled out', async () => {
      await api(app, stranger).get(`/salas/${roomId}/sessoes`).expect(403);
      await api(app, stranger).get(`/sessoes/${sessionId}`).expect(403);
    });
  });

  describe('uploading and listing', () => {
    it('stores a PDF sent by an enrolled student and by the tutor, newest first', async () => {
      const fromStudent = (await upload(student, pdf()).expect(201)).body as AttachmentBody;
      await upload(tutor, pdf(64), 'Roteiro.pdf').expect(201);

      expect(fromStudent).toMatchObject({
        nomeArquivo: 'Relatório Parcial.pdf',
        tipo: 'application/pdf',
        tamanho: pdf().length,
        enviadoPor: { id: student.id, nome: 'Ana Souza' },
      });
      const list = (await api(app, student).get(attachmentsPath()).expect(200))
        .body as AttachmentBody[];
      expect(list.map((item) => item.nomeArquivo)).toEqual([
        'Roteiro.pdf',
        'Relatório Parcial.pdf',
      ]);
    });

    it('rejects a file that is not a PDF', async () => {
      const response = await upload(
        student,
        Buffer.from('PK\u0003\u0004 docx'),
        'trabalho.pdf',
      ).expect(400);

      expect((response.body as ErrorBody).message).toContain('Envie um arquivo PDF.');
    });

    it('rejects a PDF above 10 MB before reaching the database', async () => {
      const response = await upload(student, pdf(MAX_BYTES)).expect(413);

      expect((response.body as ErrorBody).message).toBe('O arquivo deve ter no máximo 10 MB.');
    });

    it('asks for the file when the form has none', async () => {
      const response = await multipart(student).field('nome', 'x').expect(400);

      expect((response.body as ErrorBody).message).toBe('Envie um arquivo PDF no campo "arquivo".');
    });

    it('rejects a file sent under another field name', async () => {
      await upload(student, pdf(), 'Relatório.pdf', 'pdf').expect(400);
    });

    it('keeps a student who is not enrolled from uploading or listing', async () => {
      await upload(stranger, pdf()).expect(403);
      await api(app, stranger).get(attachmentsPath()).expect(403);
    });
  });

  describe('downloading', () => {
    it('returns the stored bytes with the original file name', async () => {
      const content = pdf(128);
      const { id } = (await upload(student, content).expect(201)).body as AttachmentBody;

      const response = await api(app, tutor)
        .get(`${attachmentsPath()}/${id}`)
        .buffer(true)
        .parse((res, done) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => done(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain(
        `filename*=UTF-8''${encodeURIComponent('Relatório Parcial.pdf')}`,
      );
      expect((response.body as Buffer).equals(content)).toBe(true);
    });

    it('answers 404 for an attachment that does not exist', async () => {
      await api(app, student)
        .get(`${attachmentsPath()}/00000000-0000-4000-8000-000000000000`)
        .expect(404);
    });
  });

  describe('deleting', () => {
    const sendAs = async (user: TestUser) =>
      ((await upload(user, pdf()).expect(201)).body as AttachmentBody).id;

    it('lets a student delete an attachment they sent', async () => {
      const id = await sendAs(student);

      await api(app, student).delete(`${attachmentsPath()}/${id}`).expect(204);

      const list = await api(app, tutor).get(attachmentsPath()).expect(200);
      expect(list.body).toEqual([]);
    });

    it('keeps a student from deleting an attachment sent by the tutor', async () => {
      const id = await sendAs(tutor);

      const response = await api(app, student).delete(`${attachmentsPath()}/${id}`).expect(403);

      expect((response.body as ErrorBody).message).toBe(
        'Você só pode excluir os anexos que você enviou.',
      );
    });

    it('lets the tutor delete an attachment sent by a student', async () => {
      const id = await sendAs(student);

      await api(app, tutor).delete(`${attachmentsPath()}/${id}`).expect(204);
      await api(app, tutor).get(`${attachmentsPath()}/${id}`).expect(404);
    });

    it('keeps a student who is not enrolled from deleting', async () => {
      const id = await sendAs(student);

      await api(app, stranger).delete(`${attachmentsPath()}/${id}`).expect(403);
    });
  });
});
