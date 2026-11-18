import type { MigrationInterface, QueryRunner } from 'typeorm';

const TERM_1_2_CONTENT = `# Termos de Uso e Política de Privacidade – PBL360

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

Para dúvidas, suporte acadêmico ou solicitações referentes aos seus dados pessoais, entre em contato com a equipe e o Encarregado de Dados pelo e-mail: **contato.pbl360@gmail.com**.`;

export class AddCommitmentTermVersion121793200000000 implements MigrationInterface {
  name = 'AddCommitmentTermVersion121793200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE commitment_terms
      SET is_current = FALSE
      WHERE is_current = TRUE;
    `);

    await queryRunner.query(
      `INSERT INTO commitment_terms (version, title, content, is_current)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (version) DO UPDATE SET is_current = TRUE;`,
      ['1.2', 'Termos de Uso e Política de Privacidade – PBL360', TERM_1_2_CONTENT],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE commitment_terms
      SET is_current = FALSE
      WHERE version = '1.2' AND is_current = TRUE;
    `);

    await queryRunner.query(`
      UPDATE commitment_terms
      SET is_current = TRUE
      WHERE version = '1.1';
    `);
  }
}
