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

const CURRENT_TERM_VERSION = '1.2';
const CURRENT_TERM_TITLE = 'Termos de Uso e Política de Privacidade – PBL360';
const CURRENT_TERM_TEXT = `# Termos de Uso e Política de Privacidade – PBL360

**Versão 1.2 (MVP Acadêmico e Conformidade LGPD – Lei nº 13.709/2018)** • *Atualizado em 17 de novembro de 2026*

O **PBL360** é uma aplicação web experimental, sem fins lucrativos, desenvolvida na disciplina **EXA613 – Engenharia de Software** da Universidade Estadual de Feira de Santana (UEFS), sob tutoria da Profa. Dra. Larissa Rocha Soares Bastos. Este documento estabelece as regras de utilização da plataforma e detalha como os seus dados pessoais são tratados para fins estritamente pedagógicos e de pesquisa acadêmica.

---

### 1. Objeto e Condições de Acesso

O sistema destina-se ao registro, acompanhamento e avaliação de sessões tutoriais baseadas na metodologia *Problem-Based Learning* (PBL), além de disponibilizar um canal de comunicação direta via chat entre alunos e professores.

* **Público Autorizado:** O acesso é restrito a estudantes, tutores e docentes devidamente autorizados pela coordenação da disciplina.
* **Responsabilidade da Conta:** Cada usuário é integralmente responsável pela veracidade das informações fornecidas no cadastro e pela guarda sigilosa de suas credenciais de acesso.

### 2. Regras de Uso, Chat e Condutas Proibidas

O chat integrado destina-se exclusivamente ao suporte pedagógico, orientação acadêmica e esclarecimento de dúvidas. As comunicações não são anônimas e permanecem vinculadas às respectivas contas institucionais. Ao utilizar o PBL360, o usuário compromete-se a não praticar as seguintes condutas:

* Utilizar identidade falsa ou passar-se por outro estudante, tutor ou docente;
* Realizar tentativas de invasão, varreduras automatizadas, exploração de vulnerabilidades ou injeção de código;
* Enviar ou publicar conteúdos ilícitos, ofensivos, difamatórios, spam, assédio ou compartilhar desnecessariamente dados sensíveis nas avaliações, feedbacks ou no chat.

> ### 3. Limitação de Responsabilidade (Leia com Atenção)
> 
> **O PBL360 é fornecido “no estado em que se encontra” (*as-is*), estando sujeito a falhas, instabilidades ou manutenções sem aviso prévio. A plataforma possui caráter estritamente auxiliar e NÃO substitui os sistemas acadêmicos oficiais da UEFS. A equipe desenvolvedora e a universidade não se responsabilizam por indisponibilidades técnicas ou eventuais perdas de dados transitórios.**

---

### 4. Dados Pessoais Coletados e Finalidades

Para viabilizar o funcionamento pedagógico da plataforma e cumprir exigências legais, coletamos e tratamos as seguintes categorias de dados:

* **Identificação:** Nome completo, e-mail institucional e tipo de perfil (para autenticação, controle de acesso e identificação nas turmas).
* **Segurança:** Senha de acesso, armazenada exclusivamente sob a forma de *hash* criptográfico irreversível (com *salt*).
* **Dados Acadêmicos:** Notas, autoavaliações, avaliações de pares e feedbacks das sessões tutoriais (para cálculo de médias e acompanhamento de desempenho).
* **Mensagens de Chat:** Conteúdo textual, data/hora e identificação de remetente e destinatário nas conversas entre aluno e professor (para fins de orientação acadêmica).
* **Registros de Conexão:** Endereço IP, data/hora e rotas de acesso (para segurança da aplicação e cumprimento obrigatório do Art. 15 do Marco Civil da Internet).

* Nota: O sistema não coleta nem processa dados pessoais sensíveis.*

### 5. Segurança, Sigilo e Compartilhamento de Dados

* **Infraestrutura e Criptografia:** Todos os dados e mensagens trafegam em conexão criptografada (HTTPS/TLS) e são armazenados em provedores de nuvem certificados (Vercel, Render e Supabase/PostgreSQL).
* **Sigilo das Comunicações:** O acesso às mensagens do chat é restrito aos interlocutores envolvidos (aluno e professor), sendo permitido o acesso pela equipe técnica apenas em casos de auditoria acadêmica devidamente justificada.
* **Não Comercialização:** Nenhum dado pessoal ou acadêmico é vendido, alugado ou repassado a terceiros para fins comerciais ou publicitários.

### 6. Retenção, Direitos do Titular (LGPD) e Contato

Os dados cadastrais, registros acadêmicos e mensagens do chat são mantidos ativos durante o semestre letivo vigente. Ao término do período, os dados identificáveis serão definitivamente excluídos ou devidamente anonimizados para fins exclusivos de pesquisa acadêmica na UEFS.

Nos termos do **Art. 18 da Lei Geral de Proteção de Dados (LGPD)**, você pode confirmar a existência de tratamento, solicitar acesso, corrigir informações ou requerer a exclusão de sua conta a qualquer momento.

---

### 7. Propriedade Intelectual e Canal de Atendimento

A autoria moral do software e do código-fonte pertence aos estudantes desenvolvedores da disciplina, enquanto a posse institucional e patrimonial do projeto pertence à Universidade Estadual de Feira de Santana (UEFS). Os conteúdos inseridos (feedbacks, avaliações e mensagens) pertencem aos seus respectivos autores, sendo licenciados à plataforma apenas para o processamento pedagógico.

Para dúvidas, suporte acadêmico ou solicitações referentes aos seus dados pessoais, entre em contato com a equipe e o Encarregado de Dados pelo e-mail: **[contato.pbl360@gmail.com](mailto:contato.pbl360@gmail.com)**.`;

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
        titulo: CURRENT_TERM_TITLE,
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

    it('blocks access and requires re-acceptance when a new term version becomes current', async () => {
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
        ['test-current', CURRENT_TERM_TITLE, 'Nova redação'],
      );

      const statusResponse = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-aceite-termo')
        .expect(200);
      expect(statusResponse.body).toEqual({
        aceito: false,
        versaoAceita: CURRENT_TERM_VERSION,
        aceitoEm: acceptedAt,
        versaoVigente: 'test-current',
      });

      await api(app, tutorWithoutAcceptance).get('/usuarios/meu-perfil').expect(403);

      const reacceptResponse = await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: 'test-current' })
        .expect(200);
      expect(reacceptResponse.body).toMatchObject({
        aceito: true,
        versaoAceita: 'test-current',
        versaoVigente: 'test-current',
      });

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
