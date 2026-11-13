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

interface ConversationBody {
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

    it('cria conversa com 201 quando iniciada por professor ou aluno, e retorna 200 se já existir', async () => {
      const conv1 = (
        await api(app, tutor)
          .post(`/salas/${roomId}/conversas`, { destinatarioId: student.id })
          .expect(201)
      ).body as unknown as ConversationBody;

      expect(typeof conv1.id).toBe('string');
      expect(conv1.interlocutor.id).toBe(student.id);
      expect(conv1.interlocutor.tipo).toBe(UserTypePayload.ALUNO);

      const conversaId = conv1.id;

      const conv2 = (
        await api(app, student)
          .post(`/salas/${roomId}/conversas`, { destinatarioId: tutor.id })
          .expect(200)
      ).body as unknown as ConversationBody;

      expect(conv2.id).toBe(conversaId);
      expect(conv2.interlocutor.id).toBe(tutor.id);
      expect(conv2.interlocutor.tipo).toBe(UserTypePayload.PROFESSOR);
    });
  });

  describe('GET /salas/:salaId/conversas', () => {
    it('lista as conversas do usuário na sala e garante isolamento entre co-tutores', async () => {
      const resConv1 = await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: student.id })
        .expect(201);
      const conv1 = resConv1.body as unknown as ConversationBody;

      const resConv2 = await api(app, coTutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: otherStudent.id })
        .expect(201);
      const conv2 = resConv2.body as unknown as ConversationBody;

      const tutorRes = await api(app, tutor).get(`/salas/${roomId}/conversas`).expect(200);
      const tutorList = tutorRes.body as unknown as ConversationBody[];
      expect(tutorList).toHaveLength(1);
      expect(tutorList[0]?.id).toBe(conv1.id);

      const coTutorRes = await api(app, coTutor).get(`/salas/${roomId}/conversas`).expect(200);
      const coTutorList = coTutorRes.body as unknown as ConversationBody[];
      expect(coTutorList).toHaveLength(1);
      expect(coTutorList[0]?.id).toBe(conv2.id);

      const studentRes = await api(app, student).get(`/salas/${roomId}/conversas`).expect(200);
      const studentList = studentRes.body as unknown as ConversationBody[];
      expect(studentList).toHaveLength(1);
      expect(studentList[0]?.id).toBe(conv1.id);
    });
  });

  describe('Mensagens: POST e GET /conversas/:conversaId/mensagens', () => {
    let conversaId: string;

    beforeEach(async () => {
      const res = await api(app, tutor)
        .post(`/salas/${roomId}/conversas`, { destinatarioId: student.id })
        .expect(201);
      const conv = res.body as unknown as ConversationBody;
      conversaId = conv.id;
    });

    it('rejeita envio com mensagem vazia ou em branco', async () => {
      await api(app, tutor)
        .post(`/conversas/${conversaId}/mensagens`, { texto: '   ' })
        .expect(400);
    });

    it('impede que co-tutor ou terceiro leia ou envie mensagens na conversa alheia', async () => {
      await api(app, coTutor).get(`/conversas/${conversaId}/mensagens`).expect(403);

      await api(app, coTutor)
        .post(`/conversas/${conversaId}/mensagens`, { texto: 'Espiando...' })
        .expect(403);
    });

    it('permite troca de mensagens entre os dois participantes e paginação', async () => {
      const msg1 = (
        await api(app, tutor)
          .post(`/conversas/${conversaId}/mensagens`, { texto: 'Olá estudante!' })
          .expect(201)
      ).body as unknown as MessageBody;

      expect(typeof msg1.id).toBe('string');
      expect(msg1.remetente.id).toBe(tutor.id);
      expect(msg1.texto).toBe('Olá estudante!');
      expect(typeof msg1.enviadaEm).toBe('string');

      const msg2 = (
        await api(app, student)
          .post(`/conversas/${conversaId}/mensagens`, { texto: 'Olá professor, obrigado!' })
          .expect(201)
      ).body as unknown as MessageBody;

      const listRes = await api(app, student).get(`/conversas/${conversaId}/mensagens`).expect(200);
      const listBody = listRes.body as unknown as MessagesListBody;
      expect(listBody.itens).toHaveLength(2);
      expect(listBody.itens[0]?.id).toBe(msg1.id);
      expect(listBody.itens[1]?.id).toBe(msg2.id);

      const pollingRes = await api(app, tutor)
        .get(`/conversas/${conversaId}/mensagens?apos=${msg1.id}`)
        .expect(200);
      const pollingBody = pollingRes.body as unknown as MessagesListBody;
      expect(pollingBody.itens).toHaveLength(1);
      expect(pollingBody.itens[0]?.id).toBe(msg2.id);
    });
  });
});
