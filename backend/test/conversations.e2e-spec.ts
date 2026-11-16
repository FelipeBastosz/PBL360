import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { UserTypePayload } from '@/auth/application/dtos/user-type-payload.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface RoomCreatedBody {
  id: string;
}

interface CreateConversationBody {
  id: string;
  interlocutor: {
    id: string;
    nome: string;
    tipo: UserTypePayload;
    possuiFoto: boolean;
  };
  ultimaMensagem?: unknown;
}

interface ConversationListItemBody {
  id: string;
  interlocutor: {
    id: string;
    nome: string;
    tipo: UserTypePayload;
    possuiFoto: boolean;
  };
  ultimaMensagem: {
    texto: string;
    enviadaEm: string;
  } | null;
}

interface MessageBody {
  id: string;
  remetente: {
    id: string;
    nome: string;
  };
  texto: string;
  enviadaEm: string;
}

interface MessagesListBody {
  itens: MessageBody[];
  proximoCursor: string | null;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
}

describe('Conversations (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let dataSource: DataSource;

  let tutor: TestUser;
  let coTutor: TestUser;
  let outsiderTutor: TestUser;
  let student: TestUser;
  let otherStudent: TestUser;
  let outsiderStudent: TestUser;
  let roomId: string;

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource) await cleanDatabase(dataSource);
    if (app) await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);

    tutor = await insertUser(app, dataSource, 'tutor@uefs.br', UserType.TUTOR);
    coTutor = await insertUser(app, dataSource, 'cotutor@uefs.br', UserType.TUTOR);
    outsiderTutor = await insertUser(app, dataSource, 'outsider_tutor@uefs.br', UserType.TUTOR);

    student = await insertUser(app, dataSource, '11111111@discente.uefs.br', UserType.STUDENT);
    otherStudent = await insertUser(app, dataSource, '22222222@discente.uefs.br', UserType.STUDENT);
    outsiderStudent = await insertUser(
      app,
      dataSource,
      '33333333@discente.uefs.br',
      UserType.STUDENT,
    );

    const roomRes = await api(app, tutor)
      .post('/salas', {
        nome: 'Turma de Teste Chat',
        codigoDisciplina: 'EXA854',
        semestre: '2026.2',
      })
      .expect(201);
    const roomBody = roomRes.body as unknown as RoomCreatedBody;
    roomId = roomBody.id;

    await api(app, tutor)
      .post(`/salas/${roomId}/professores`, { professorId: coTutor.id })
      .expect(201);

    await dataSource.query(
      `INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);`,
      [roomId, student.id, otherStudent.id],
    );
  });

  describe('POST /salas/:salaId/conversas', () => {
    it('requere autenticação', async () => {
      await api(app).post(`/salas/${roomId}/conversas`, { destinatarioId: student.id }).expect(401);
    });

    it('rejeita conversa com o próprio usuário', async () => {
      const res = await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: tutor.id })
        .expect(400);

      const errorBody = res.body as unknown as ErrorResponseBody;
      expect(errorBody.message).toContain('Não é possível iniciar uma conversa consigo mesmo.');
    });

    it('rejeita conversa entre dois professores', async () => {
      const res = await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: coTutor.id })
        .expect(400);

      const errorBody = res.body as unknown as ErrorResponseBody;
      expect(errorBody.message).toContain(
        'Conversas só são permitidas entre um professor e um aluno.',
      );
    });

    it('rejeita conversa entre dois alunos', async () => {
      const res = await api(app, student)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: otherStudent.id })
        .expect(400);

      const errorBody = res.body as unknown as ErrorResponseBody;
      expect(errorBody.message).toContain(
        'Conversas só são permitidas entre um professor e um aluno.',
      );
    });

    it('rejeita quando usuário autenticado não participa da sala', async () => {
      await api(app, outsiderTutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: student.id })
        .expect(403);
    });

    it('rejeita quando destinatário não possui vínculo com a sala', async () => {
      await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: outsiderStudent.id })
        .expect(403);
    });

    it('rejeita criação quando destinatário está inativo', async () => {
      const inactiveStudent = await insertUser(
        app,
        dataSource,
        'inactive@discente.uefs.br',
        UserType.STUDENT,
      );
      await dataSource.query(`INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);`, [
        roomId,
        inactiveStudent.id,
      ]);
      await dataSource.query(`UPDATE users SET active = false WHERE id = $1`, [inactiveStudent.id]);

      const res = await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: inactiveStudent.id })
        .expect(404);

      const errorBody = res.body as unknown as ErrorResponseBody;
      expect(errorBody.message).toContain('Destinatário não encontrado.');
    });

    it('rejeita criação quando a sala está desativada', async () => {
      await dataSource.query(`UPDATE rooms SET active = false WHERE id = $1`, [roomId]);

      const res = await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: student.id })
        .expect(403);

      const errorBody = res.body as unknown as ErrorResponseBody;
      expect(errorBody.message).toContain(
        'Não é possível iniciar conversas em uma sala desativada.',
      );
    });

    it('cria conversa com 201 quando iniciada por professor ou aluno, e retorna 200 se já existir', async () => {
      const conv1 = (
        await api(app, tutor)
          .post(`/salas/${roomId}/conversas`, { destinatarioId: student.id })
          .expect(201)
      ).body as unknown as CreateConversationBody;

      expect(typeof conv1.id).toBe('string');
      expect(conv1.interlocutor.id).toBe(student.id);
      expect(conv1.interlocutor.tipo).toBe(UserTypePayload.ALUNO);
      expect(conv1.interlocutor.possuiFoto).toBe(false);
      expect(conv1.ultimaMensagem).toBeUndefined();

      const conversaId = conv1.id;

      const conv2 = (
        await api(app, student)
          .post(`/salas/${roomId}/conversas`, { destinatarioId: tutor.id })
          .expect(200)
      ).body as unknown as CreateConversationBody;

      expect(conv2.id).toBe(conversaId);
      expect(conv2.interlocutor.id).toBe(tutor.id);
      expect(conv2.interlocutor.tipo).toBe(UserTypePayload.PROFESSOR);
      expect(conv2.ultimaMensagem).toBeUndefined();
    });

    it('lida com criação concorrente garantindo unicidade no banco', async () => {
      const requests = [
        api(app, tutor).post(`/salas/${roomId}/conversas`, { destinatarioId: otherStudent.id }),
        api(app, otherStudent).post(`/salas/${roomId}/conversas`, { destinatarioId: tutor.id }),
        api(app, tutor).post(`/salas/${roomId}/conversas`, { destinatarioId: otherStudent.id }),
        api(app, otherStudent).post(`/salas/${roomId}/conversas`, { destinatarioId: tutor.id }),
      ];

      const responses = await Promise.all(requests);
      const statuses = responses.map((r) => r.status).sort((a, b) => a - b);
      expect(statuses).toEqual([200, 200, 200, 201]);

      const conversationIds = new Set(
        responses.map((r) => (r.body as unknown as CreateConversationBody).id),
      );
      expect(conversationIds.size).toBe(1);

      const dbRows = await dataSource.query<{ count: string }[]>(
        `SELECT count(*) AS count FROM conversations
         WHERE room_id = $1 AND tutor_id = $2 AND student_id = $3;`,
        [roomId, tutor.id, otherStudent.id],
      );
      expect(Number(dbRows[0]?.count)).toBe(1);
    });
  });

  describe('GET /salas/:salaId/conversas', () => {
    it('lista as conversas do usuário na sala e garante isolamento entre co-tutores', async () => {
      const resConv1 = await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: student.id })
        .expect(201);
      const conv1 = resConv1.body as unknown as CreateConversationBody;

      const resConv2 = await api(app, coTutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: otherStudent.id })
        .expect(201);
      const conv2 = resConv2.body as unknown as CreateConversationBody;

      const tutorRes = await api(app, tutor).get(`/salas/${roomId}/conversas`).expect(200);
      const tutorList = tutorRes.body as unknown as ConversationListItemBody[];
      expect(tutorList).toHaveLength(1);
      expect(tutorList[0]?.id).toBe(conv1.id);

      const coTutorRes = await api(app, coTutor).get(`/salas/${roomId}/conversas`).expect(200);
      const coTutorList = coTutorRes.body as unknown as ConversationListItemBody[];
      expect(coTutorList).toHaveLength(1);
      expect(coTutorList[0]?.id).toBe(conv2.id);

      const studentRes = await api(app, student).get(`/salas/${roomId}/conversas`).expect(200);
      const studentList = studentRes.body as unknown as ConversationListItemBody[];
      expect(studentList).toHaveLength(1);
      expect(studentList[0]?.id).toBe(conv1.id);
    });

    it('ordena conversas pela última mensagem DESC com NULLS LAST e reflete possuiFoto', async () => {
      await dataSource.query(
        `INSERT INTO user_photos (user_id, content, mime_type)
         VALUES ($1, $2, $3);`,
        [student.id, Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg'],
      );

      const conv1 = (
        await api(app, tutor)
          .post(`/salas/${roomId}/conversas`, { destinatarioId: student.id })
          .expect(201)
      ).body as unknown as CreateConversationBody;

      const conv2 = (
        await api(app, tutor)
          .post(`/salas/${roomId}/conversas`, { destinatarioId: otherStudent.id })
          .expect(201)
      ).body as unknown as CreateConversationBody;

      await api(app, tutor)
        .post(`/conversas/${conv1.id}/mensagens`, { texto: 'Primeira mensagem no conv1' })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 50));

      await api(app, tutor)
        .post(`/conversas/${conv2.id}/mensagens`, { texto: 'Mensagem mais recente no conv2' })
        .expect(201);

      const listRes = await api(app, tutor).get(`/salas/${roomId}/conversas`).expect(200);
      const list = listRes.body as unknown as ConversationListItemBody[];
      expect(list).toHaveLength(2);
      expect(list[0]?.id).toBe(conv2.id);
      expect(list[0]?.ultimaMensagem?.texto).toBe('Mensagem mais recente no conv2');
      expect(list[1]?.id).toBe(conv1.id);
      expect(list[1]?.interlocutor.possuiFoto).toBe(true);
    });
  });

  describe('Mensagens: POST e GET /conversas/:conversaId/mensagens', () => {
    let conversaId: string;

    beforeEach(async () => {
      const res = await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: student.id })
        .expect(201);
      const conv = res.body as unknown as CreateConversationBody;
      conversaId = conv.id;
    });

    it('rejeita envio com mensagem vazia ou em branco', async () => {
      await api(app, tutor)
        .post(`/conversas/${conversaId}/mensagens`, { texto: '   ' })
        .expect(400);
    });

    it('rejeita envio composto apenas por caracteres invisíveis (zero-width)', async () => {
      await api(app, tutor)
        .post(`/conversas/${conversaId}/mensagens`, { texto: '\u200B\u200C\u200D\uFEFF' })
        .expect(400);
    });

    it('rejeita payload com campos extras não permitidos como remetenteId', async () => {
      await api(app, tutor)
        .post(`/conversas/${conversaId}/mensagens`, {
          texto: 'Tentativa de forja',
          remetenteId: student.id,
        })
        .expect(400);
    });

    it('aceita mensagem com 2000 caracteres e rejeita com 2001 caracteres', async () => {
      await api(app, tutor)
        .post(`/conversas/${conversaId}/mensagens`, { texto: 'a'.repeat(2001) })
        .expect(400);

      const resValid = await api(app, tutor)
        .post(`/conversas/${conversaId}/mensagens`, { texto: 'a'.repeat(2000) })
        .expect(201);

      const msg = resValid.body as unknown as MessageBody;
      expect(msg.texto).toHaveLength(2000);
    });

    it('impede que co-tutor ou terceiro leia ou envie mensagens na conversa alheia', async () => {
      await api(app, coTutor).get(`/conversas/${conversaId}/mensagens`).expect(403);

      await api(app, coTutor)
        .post(`/conversas/${conversaId}/mensagens`, { texto: 'Espiando...' })
        .expect(403);
    });

    it('impede envio de mensagem quando a sala está desativada', async () => {
      await dataSource.query(`UPDATE rooms SET active = false WHERE id = $1`, [roomId]);

      const res = await api(app, tutor)
        .post(`/conversas/${conversaId}/mensagens`, { texto: 'Tentando enviar na sala inativa' })
        .expect(403);

      const errorBody = res.body as unknown as ErrorResponseBody;
      expect(errorBody.message).toContain(
        'Não é possível enviar mensagens em uma sala desativada.',
      );
    });

    it('impede envio de mensagem quando o discente destinatário perdeu vínculo com a sala', async () => {
      await dataSource.query(`DELETE FROM room_students WHERE room_id = $1 AND student_id = $2;`, [
        roomId,
        student.id,
      ]);

      const res = await api(app, tutor)
        .post(`/conversas/${conversaId}/mensagens`, { texto: 'Oi sumida!' })
        .expect(403);

      const errorBody = res.body as unknown as ErrorResponseBody;
      expect(errorBody.message).toContain('O destinatário não possui mais vínculo com esta sala.');
    });

    it('impede envio de mensagem quando o co-tutor destinatário perdeu vínculo com a sala', async () => {
      const coTutorConvRes = await api(app, coTutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: otherStudent.id })
        .expect(201);
      const coTutorConvId = (coTutorConvRes.body as unknown as CreateConversationBody).id;

      await dataSource.query(`DELETE FROM room_tutors WHERE room_id = $1 AND tutor_id = $2;`, [
        roomId,
        coTutor.id,
      ]);

      const res = await api(app, otherStudent)
        .post(`/conversas/${coTutorConvId}/mensagens`, { texto: 'Oi professora!' })
        .expect(403);

      const errorBody = res.body as unknown as ErrorResponseBody;
      expect(errorBody.message).toContain('O destinatário não possui mais vínculo com esta sala.');
    });

    it('rejeita cursor pertencente a outra conversa com 404', async () => {
      const otherConvRes = await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: otherStudent.id })
        .expect(201);
      const otherConvId = (otherConvRes.body as unknown as CreateConversationBody).id;

      const otherMsg = (
        await api(app, tutor)
          .post(`/conversas/${otherConvId}/mensagens`, { texto: 'Mensagem de outra conversa' })
          .expect(201)
      ).body as unknown as MessageBody;

      const res = await api(app, tutor)
        .get(`/conversas/${conversaId}/mensagens?cursor=${otherMsg.id}`)
        .expect(404);

      const errorBody = res.body as unknown as ErrorResponseBody;
      expect(errorBody.message).toContain(
        'Mensagem de referência (cursor) não encontrada nesta conversa.',
      );
    });

    it('permite troca de mensagens, paginação completa com cursor e proximoCursor, e polling com apos', async () => {
      const sentMessages: MessageBody[] = [];
      for (let i = 1; i <= 5; i++) {
        const sender = i % 2 === 1 ? tutor : student;
        const res = await api(app, sender)
          .post(`/conversas/${conversaId}/mensagens`, { texto: `Mensagem ${i}` })
          .expect(201);
        const body = res.body as MessageBody;
        sentMessages.push(body);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      expect(sentMessages[0]?.remetente.nome).toBe('Usuário de Teste');

      // Página 1 (mais recentes: limit 2 -> msgs 4 e 5)
      const page1Res = await api(app, student)
        .get(`/conversas/${conversaId}/mensagens?limite=2`)
        .expect(200);
      const page1 = page1Res.body as unknown as MessagesListBody;
      expect(page1.itens).toHaveLength(2);
      expect(page1.itens.map((m) => m.texto)).toEqual(['Mensagem 4', 'Mensagem 5']);
      expect(page1.proximoCursor).toBe(sentMessages[3]?.id);

      // Página 2 (msgs 2 e 3 via cursor da página 1)
      const page2Res = await api(app, student)
        .get(`/conversas/${conversaId}/mensagens?limite=2&cursor=${page1.proximoCursor}`)
        .expect(200);
      const page2 = page2Res.body as unknown as MessagesListBody;
      expect(page2.itens).toHaveLength(2);
      expect(page2.itens.map((m) => m.texto)).toEqual(['Mensagem 2', 'Mensagem 3']);
      expect(page2.proximoCursor).toBe(sentMessages[1]?.id);

      // Página 3 (msg 1 via cursor da página 2)
      const page3Res = await api(app, student)
        .get(`/conversas/${conversaId}/mensagens?limite=2&cursor=${page2.proximoCursor}`)
        .expect(200);
      const page3 = page3Res.body as unknown as MessagesListBody;
      expect(page3.itens).toHaveLength(1);
      expect(page3.itens[0]?.texto).toBe('Mensagem 1');
      expect(page3.proximoCursor).toBeNull();

      // Polling com apos trazendo apenas mensagens novas
      const pollingRes = await api(app, tutor)
        .get(`/conversas/${conversaId}/mensagens?apos=${sentMessages[3]?.id}`)
        .expect(200);
      const polling = pollingRes.body as unknown as MessagesListBody;
      expect(polling.itens).toHaveLength(1);
      expect(polling.itens[0]?.id).toBe(sentMessages[4]?.id);
      expect(polling.proximoCursor).toBeNull();

      // Recuperar histórico completo sem paginação (limite padrão 30)
      const fullHistoryRes = await api(app, tutor)
        .get(`/conversas/${conversaId}/mensagens`)
        .expect(200);
      const fullHistory = fullHistoryRes.body as unknown as MessagesListBody;
      expect(fullHistory.itens).toHaveLength(5);
      expect(fullHistory.proximoCursor).toBeNull();
    });
  });
});
