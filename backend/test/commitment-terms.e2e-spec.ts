import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface TermAcceptancePayload {
  aceito: boolean;
  versaoAceita: string | null;
  aceitoEm: string | null;
  versaoVigente: string;
}

interface TermPayload {
  versao: string;
  titulo: string;
  texto: string;
}

interface CountRow {
  count: number;
}

interface AcceptedTermRow {
  version: string;
  content: string;
}

const CURRENT_TERM_VERSION = '1.1';
const CURRENT_TERM_TEXT = [
  'Ao utilizar o PBL360 como professor ou aluno, comprometo-me a:',
  '',
  '- Utilizar a plataforma para as atividades acadêmicas de tutoria e respeitar as orientações da turma.',
  '- Manter minhas credenciais de acesso pessoais e não permitir que outras pessoas utilizem minha conta.',
  '- Registrar informações verdadeiras e identificar corretamente minha participação nas atividades e entregas, sem me passar por outra pessoa.',
  '- Comunicar-me com respeito. Usar mensagens, observações e feedbacks de forma adequada ao contexto acadêmico, sem ofensas ou exposição indevida de colegas.',
  '- Respeitar a privacidade das pessoas. Não divulgar fotos, notas, feedbacks ou mensagens de outras pessoas sem autorização.',
  '- Quando atuar como professor, registrar avaliações e orientações com cuidado, respeitando as regras da atividade e os procedimentos de correção do sistema.',
  '- Quando atuar como aluno, acompanhar as informações disponibilizadas, participar das atividades e procurar o professor quando identificar dúvidas ou inconsistências.',
  '- Comunicar à equipe responsável qualquer problema de acesso ou uso indevido de informações que eu identificar.',
].join('\n');

describe('Commitment Terms (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let tutorWithoutAcceptance: TestUser;
  let studentWithoutAcceptance: TestUser;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    database = testApp.moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (database) await cleanDatabase(database);
    if (app) await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(database);
    tutorWithoutAcceptance = await insertUser(
      app,
      database,
      'tutor@uefs.br',
      UserType.TUTOR,
      false,
    );
    studentWithoutAcceptance = await insertUser(
      app,
      database,
      'aluno@discente.uefs.br',
      UserType.STUDENT,
      false,
    );
  });

  describe('GET /termos-compromisso/vigente', () => {
    it('allows public unauthenticated query and returns current term', async () => {
      const response = await api(app).get('/termos-compromisso/vigente').expect(200);
      const body = response.body as TermPayload;

      expect(body).toEqual({
        versao: CURRENT_TERM_VERSION,
        titulo: 'Termo de Compromisso e Uso do Sistema PBL360',
        texto: CURRENT_TERM_TEXT,
      });

      const status = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-aceite-termo')
        .expect(200);
      const statusBody = status.body as TermAcceptancePayload;
      expect(statusBody.aceito).toBe(false);
    });
  });

  describe('GET /usuarios/meu-aceite-termo', () => {
    it('returns 401 when request is not authenticated', async () => {
      await api(app).get('/usuarios/meu-aceite-termo').expect(401);
    });

    it('returns null acceptance fields for an existing account without an acceptance record', async () => {
      const response = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-aceite-termo')
        .expect(200);

      expect(response.body).toEqual({
        aceito: false,
        versaoAceita: null,
        aceitoEm: null,
        versaoVigente: CURRENT_TERM_VERSION,
      });
    });
  });

  describe('Access blocking before acceptance', () => {
    it('blocks business features with 403 before acceptance for tutor', async () => {
      const response = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-perfil')
        .expect(403);

      expect(response.body).toHaveProperty(
        'message',
        'É necessário aceitar o termo de compromisso para acessar o sistema.',
      );
    });

    it('blocks business features with 403 before acceptance for student', async () => {
      const response = await api(app, studentWithoutAcceptance)
        .get('/usuarios/meu-perfil')
        .expect(403);

      expect(response.body).toHaveProperty(
        'message',
        'É necessário aceitar o termo de compromisso para acessar o sistema.',
      );
    });
  });

  describe('POST /usuarios/meu-aceite-termo', () => {
    it('returns 401 when request is unauthenticated', async () => {
      await api(app)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: CURRENT_TERM_VERSION })
        .expect(401);
    });

    it('returns 400 when body is invalid', async () => {
      await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: '' })
        .expect(400);
    });

    it('returns 409 when version is outdated on first acceptance', async () => {
      await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: '0.9' })
        .expect(409);
    });

    it('successfully registers first acceptance and unlocks business features', async () => {
      const acceptResponse = await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: CURRENT_TERM_VERSION })
        .expect(200);

      expect(acceptResponse.body).toEqual({
        aceito: true,
        versaoAceita: CURRENT_TERM_VERSION,
        aceitoEm: expect.any(String) as string,
        versaoVigente: CURRENT_TERM_VERSION,
      });

      const statusResponse = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-aceite-termo')
        .expect(200);
      const statusBody = statusResponse.body as TermAcceptancePayload;

      expect(statusBody.aceito).toBe(true);
      expect(statusBody.versaoAceita).toBe(CURRENT_TERM_VERSION);

      await api(app, tutorWithoutAcceptance).get('/usuarios/meu-perfil').expect(200);
    });

    it('registers first acceptance for a student and unlocks business features', async () => {
      const response = await api(app, studentWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: CURRENT_TERM_VERSION })
        .expect(200);
      const responseBody = response.body as TermAcceptancePayload;

      expect(responseBody).toMatchObject({
        aceito: true,
        versaoAceita: CURRENT_TERM_VERSION,
        versaoVigente: CURRENT_TERM_VERSION,
      });
      expect(responseBody.aceitoEm).toEqual(expect.any(String));

      await api(app, studentWithoutAcceptance).get('/usuarios/meu-perfil').expect(200);
    });

    it('handles repeated acceptance idempotently without changing original date', async () => {
      const first = await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: CURRENT_TERM_VERSION })
        .expect(200);
      const firstBody = first.body as TermAcceptancePayload;
      const firstDate = firstBody.aceitoEm;

      const second = await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: CURRENT_TERM_VERSION })
        .expect(200);
      const secondBody = second.body as TermAcceptancePayload;

      expect(secondBody.aceitoEm).toBe(firstDate);

      const rows = await database.query<CountRow[]>(
        'SELECT count(*)::int AS count FROM user_term_acceptances WHERE user_id = $1;',
        [tutorWithoutAcceptance.id],
      );
      expect(Number(rows[0]?.count)).toBe(1);
    });

    it('rejects attempts to assign acceptance to another account', async () => {
      const otherUser = await insertUser(
        app,
        database,
        'outro-aluno@discente.uefs.br',
        UserType.STUDENT,
        false,
      );

      await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: CURRENT_TERM_VERSION, usuarioId: otherUser.id })
        .expect(400);

      const tutorStatus = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-aceite-termo')
        .expect(200);
      const otherUserStatus = await api(app, otherUser)
        .get('/usuarios/meu-aceite-termo')
        .expect(200);
      const tutorStatusBody = tutorStatus.body as TermAcceptancePayload;
      const otherUserStatusBody = otherUserStatus.body as TermAcceptancePayload;

      expect(tutorStatusBody.aceito).toBe(false);
      expect(otherUserStatusBody.aceito).toBe(false);
    });

    it('keeps access and the accepted text when a new term version becomes current', async () => {
      const acceptedResponse = await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: CURRENT_TERM_VERSION })
        .expect(200);
      const acceptedAt = (acceptedResponse.body as TermAcceptancePayload).aceitoEm;

      await database.query(
        'UPDATE commitment_terms SET is_current = FALSE WHERE is_current = TRUE;',
      );
      await database.query(
        `INSERT INTO commitment_terms (version, title, content, is_current)
         VALUES ($1, $2, $3, TRUE);`,
        ['test-current', 'Termo de Compromisso e Uso do Sistema PBL360', 'Nova redação'],
      );

      const statusResponse = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-aceite-termo')
        .expect(200);
      expect(statusResponse.body).toEqual({
        aceito: true,
        versaoAceita: CURRENT_TERM_VERSION,
        aceitoEm: acceptedAt,
        versaoVigente: 'test-current',
      });

      const acceptedTerms = await database.query<AcceptedTermRow[]>(
        `SELECT terms.version, terms.content
         FROM user_term_acceptances AS acceptances
         JOIN commitment_terms AS terms ON terms.id = acceptances.term_id
         WHERE acceptances.user_id = $1;`,
        [tutorWithoutAcceptance.id],
      );
      expect(acceptedTerms).toEqual([
        { version: CURRENT_TERM_VERSION, content: CURRENT_TERM_TEXT },
      ]);

      await api(app, tutorWithoutAcceptance).get('/usuarios/meu-perfil').expect(200);
    });

    it('keeps business features blocked when acceptance persistence fails', async () => {
      try {
        await database.query(
          'DROP TRIGGER IF EXISTS reject_term_acceptance_insert ON user_term_acceptances;',
        );
        await database.query('DROP FUNCTION IF EXISTS reject_term_acceptance_insert();');
        await database.query(`
          CREATE OR REPLACE FUNCTION reject_term_acceptance_insert()
          RETURNS TRIGGER AS $$
          BEGIN
            RAISE EXCEPTION 'Acceptance persistence failure';
          END;
          $$ LANGUAGE plpgsql;
        `);
        await database.query(`
          CREATE TRIGGER reject_term_acceptance_insert
          BEFORE INSERT ON user_term_acceptances
          FOR EACH ROW EXECUTE FUNCTION reject_term_acceptance_insert();
        `);

        await api(app, tutorWithoutAcceptance)
          .post('/usuarios/meu-aceite-termo')
          .send({ versao: CURRENT_TERM_VERSION })
          .expect(500);

        await api(app, tutorWithoutAcceptance).get('/usuarios/meu-perfil').expect(403);
      } finally {
        await database.query(
          'DROP TRIGGER IF EXISTS reject_term_acceptance_insert ON user_term_acceptances;',
        );
        await database.query('DROP FUNCTION IF EXISTS reject_term_acceptance_insert();');
      }
    });
  });
});
