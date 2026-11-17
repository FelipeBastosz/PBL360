import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedbackTemplates1793000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS feedback_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(120) NOT NULL,
        text VARCHAR(2000) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_feedback_templates_title UNIQUE (title)
      );

      INSERT INTO feedback_templates (id, title, text)
      VALUES
        (
          '4f700000-0000-4000-8000-000000000001',
          'Boa participação e engajamento',
          'Demonstrou participação ativa durante a sessão tutorial, contribuindo com perguntas e reflexões pertinentes para o avanço da discussão do grupo.'
        ),
        (
          '4f700000-0000-4000-8000-000000000002',
          'Necessidade de aprofundar argumentos',
          'Participou das discussões da sessão, porém recomenda-se aprofundar a fundamentação teórica e articular melhor as evidências ao apresentar argumentos ao grupo.'
        ),
        (
          '4f700000-0000-4000-8000-000000000003',
          'Preparação para a próxima sessão',
          'Para a próxima sessão tutorial, recomenda-se reforçar a leitura prévia das referências e organizar os objetivos de aprendizagem para contribuir com maior segurança no fechamento.'
        ),
        (
          '4f700000-0000-4000-8000-000000000004',
          'Colaboração e escuta ativa',
          'Manteve postura colaborativa e escuta ativa diante das colocações dos colegas, favorecendo a construção coletiva de hipóteses e o equilíbrio nas falas do grupo.'
        ),
        (
          '4f700000-0000-4000-8000-000000000005',
          'Pontualidade e postura proativa',
          'Demonstrou pontualidade, comprometimento e postura proativa ao longo da sessão tutorial, auxiliando na organização das etapas e no foco do grupo sobre o problema.'
        )
      ON CONFLICT DO NOTHING;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS feedback_templates;');
  }
}
