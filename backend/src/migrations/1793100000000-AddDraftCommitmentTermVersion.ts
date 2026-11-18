import type { MigrationInterface, QueryRunner } from 'typeorm';

const DRAFT_TERM_CONTENT = [
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

export class AddDraftCommitmentTermVersion1793100000000 implements MigrationInterface {
  name = 'AddDraftCommitmentTermVersion1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE commitment_terms
      SET is_current = FALSE
      WHERE is_current = TRUE;
    `);

    await queryRunner.query(
      `INSERT INTO commitment_terms (version, title, content, is_current)
       VALUES ($1, $2, $3, TRUE);`,
      ['1.1', 'Termo de Compromisso e Uso do Sistema PBL360', DRAFT_TERM_CONTENT],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE commitment_terms
      SET is_current = FALSE
      WHERE version = '1.1' AND is_current = TRUE;
    `);

    await queryRunner.query(`DELETE FROM commitment_terms WHERE version = '1.1';`);

    await queryRunner.query(`
      UPDATE commitment_terms
      SET is_current = TRUE
      WHERE version = '1.0';
    `);
  }
}
