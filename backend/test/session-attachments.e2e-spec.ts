import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AddAttachmentCategory1793600000000 } from '@/migrations/1793600000000-AddAttachmentCategory';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import {
  api,
  cleanDatabase,
  insertDefaultPerformanceTable,
  insertUser,
  type TestUser,
} from './helpers/fixtures';

interface AttachmentBody {
  id: string;
  nomeArquivo: string;
  tipo: string;
  tamanho: number;
  categoria: string;
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
    categoria: string | null = 'ANEXO_SESSAO',
  ) => {
    const req = multipart(user).attach(field, content, {
      filename: fileName,
      contentType: 'application/pdf',
    });
    return categoria === null ? req : req.field('categoria', categoria);
  };

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
    await insertDefaultPerformanceTable(dataSource, tutor.id);
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
        data: '01-10-2026',
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
          data: '01-10-2026',
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
    it('stores a PDF sent by an enrolled student and by the tutor with explicit categories, newest first', async () => {
      const fromStudent = (
        await upload(student, pdf(), 'Relatório Parcial.pdf', 'arquivo', 'ANEXO_SESSAO').expect(201)
      ).body as AttachmentBody;
      const fromTutor = (
        await upload(tutor, pdf(64), 'Roteiro.pdf', 'arquivo', 'RELATORIO_MESA').expect(201)
      ).body as AttachmentBody;

      expect(fromStudent).toMatchObject({
        nomeArquivo: 'Relatório Parcial.pdf',
        tipo: 'application/pdf',
        tamanho: pdf().length,
        categoria: 'ANEXO_SESSAO',
        enviadoPor: { id: student.id, nome: 'Ana Souza' },
      });
      expect(fromTutor).toMatchObject({
        nomeArquivo: 'Roteiro.pdf',
        categoria: 'RELATORIO_MESA',
      });

      const list = (await api(app, student).get(attachmentsPath()).expect(200))
        .body as AttachmentBody[];
      expect(list.map((item) => ({ nome: item.nomeArquivo, categoria: item.categoria }))).toEqual([
        { nome: 'Roteiro.pdf', categoria: 'RELATORIO_MESA' },
        { nome: 'Relatório Parcial.pdf', categoria: 'ANEXO_SESSAO' },
      ]);
    });

    it('does not infer category from the file name', async () => {
      const uploaded = (
        await upload(tutor, pdf(), 'Relatorio_Mesa_Final.pdf', 'arquivo', 'ANEXO_SESSAO').expect(
          201,
        )
      ).body as AttachmentBody;

      expect(uploaded.categoria).toBe('ANEXO_SESSAO');
    });

    it('backfills legacy rows as ANEXO_SESSAO during migration and rejects inserts without category afterwards', async () => {
      const migration = new AddAttachmentCategory1793600000000();
      const queryRunner = dataSource.createQueryRunner();
      try {
        await migration.down(queryRunner);
        await queryRunner.query(
          `INSERT INTO session_attachments (session_id, uploaded_by, file_name, mime_type, size_bytes, content)
           VALUES ($1, $2, 'Legado.pdf', 'application/pdf', $3, $4);`,
          [sessionId, tutor.id, pdf().length, pdf()],
        );
        await migration.up(queryRunner);
      } finally {
        await queryRunner.release();
      }

      const list = (await api(app, student).get(attachmentsPath()).expect(200))
        .body as AttachmentBody[];
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({
        nomeArquivo: 'Legado.pdf',
        categoria: 'ANEXO_SESSAO',
      });

      await expect(
        dataSource.query(
          `INSERT INTO session_attachments (session_id, uploaded_by, file_name, mime_type, size_bytes, content)
           VALUES ($1, $2, 'SemCategoria.pdf', 'application/pdf', $3, $4);`,
          [sessionId, tutor.id, pdf().length, pdf()],
        ),
      ).rejects.toThrow();
    });

    it('rejects missing category even when file name suggests a board report', async () => {
      const missing = await upload(student, pdf(), 'relatorio_mesa.pdf', 'arquivo', null).expect(
        400,
      );
      expect((missing.body as ErrorBody).message).toBe(
        'A categoria deve ser "RELATORIO_MESA" ou "ANEXO_SESSAO".',
      );
    });

    it.each(['', ' ', 'relatorio_mesa', 'anexo_sessao', 'OUTRA_CATEGORIA', 'toString'])(
      'rejects invalid category %j',
      async (invalidCategory) => {
        const invalid = await upload(
          student,
          pdf(),
          'relatorio_mesa.pdf',
          'arquivo',
          invalidCategory,
        ).expect(400);
        expect((invalid.body as ErrorBody).message).toBe(
          'A categoria deve ser "RELATORIO_MESA" ou "ANEXO_SESSAO".',
        );
      },
    );

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
      const response = await multipart(student).field('categoria', 'ANEXO_SESSAO').expect(400);

      expect((response.body as ErrorBody).message).toBe('Envie um arquivo PDF no campo "arquivo".');
    });

    it('rejects a file sent under another field name', async () => {
      await upload(student, pdf(), 'Relatório.pdf', 'pdf').expect(400);
    });

    it('keeps a student who is not enrolled from uploading or listing', async () => {
      await upload(stranger, pdf()).expect(403);
      await upload(stranger, pdf(), 'Relatório.pdf', 'arquivo', null).expect(403);
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

    it('downloads a RELATORIO_MESA attachment', async () => {
      const content = pdf(96);
      const { id } = (
        await upload(tutor, content, 'Relatório Mesa.pdf', 'arquivo', 'RELATORIO_MESA').expect(201)
      ).body as AttachmentBody;

      const response = await api(app, student)
        .get(`${attachmentsPath()}/${id}`)
        .buffer(true)
        .parse((res, done) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => done(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect((response.body as Buffer).equals(content)).toBe(true);
    });

    it('keeps a student who is not enrolled from downloading', async () => {
      const { id } = (await upload(student, pdf()).expect(201)).body as AttachmentBody;

      await api(app, stranger).get(`${attachmentsPath()}/${id}`).expect(403);
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

    it('lets the tutor delete a RELATORIO_MESA attachment', async () => {
      const { id } = (
        await upload(tutor, pdf(), 'Relatório Mesa.pdf', 'arquivo', 'RELATORIO_MESA').expect(201)
      ).body as AttachmentBody;

      await api(app, tutor).delete(`${attachmentsPath()}/${id}`).expect(204);
      await api(app, tutor).get(`${attachmentsPath()}/${id}`).expect(404);
    });

    it('keeps a student who is not enrolled from deleting', async () => {
      const id = await sendAs(student);

      await api(app, stranger).delete(`${attachmentsPath()}/${id}`).expect(403);
    });
  });
});
