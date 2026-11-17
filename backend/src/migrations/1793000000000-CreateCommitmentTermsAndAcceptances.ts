import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommitmentTermsAndAcceptances1793000000000 implements MigrationInterface {
  name = 'CreateCommitmentTermsAndAcceptances1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE commitment_terms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version VARCHAR(20) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        is_current BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_commitment_terms_version UNIQUE (version)
      );

      CREATE UNIQUE INDEX uq_commitment_terms_current
        ON commitment_terms (is_current)
        WHERE is_current = TRUE;

      INSERT INTO commitment_terms (version, title, content, is_current)
      VALUES (
        '1.0',
        'Termo de Compromisso e Uso do Sistema PBL360',
        'Ao utilizar a plataforma PBL360, docentes e discentes comprometem-se a cumprir com as diretrizes de integridade acadêmica do método PBL, prezando pelo sigilo das avaliações e pela colaboração ética e construtiva.',
        TRUE
      );

      CREATE TABLE user_term_acceptances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        term_id UUID NOT NULL REFERENCES commitment_terms(id) ON DELETE RESTRICT,
        term_version VARCHAR(20) NOT NULL,
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_user_term_acceptances_user UNIQUE (user_id)
      );

      CREATE INDEX idx_user_term_acceptances_user_id ON user_term_acceptances (user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS user_term_acceptances;
      DROP TABLE IF EXISTS commitment_terms;
    `);
  }
}
