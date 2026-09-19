import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1789781008821 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE tipo_usuario AS ENUM ('TUTOR', 'ALUNO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE usuario (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(120) NOT NULL,
        email VARCHAR(160) NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        matricula VARCHAR(20) DEFAULT NULL,
        foto_url VARCHAR(255) DEFAULT NULL,
        tipo tipo_usuario NOT NULL,
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_usuario_email UNIQUE (email),
        CONSTRAINT uq_usuario_matricula UNIQUE (matricula)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_usuario_email ON usuario(email);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_usuario_email;`);
    await queryRunner.query(`DROP TABLE IF EXISTS usuario;`);
    await queryRunner.query(`DROP TYPE IF EXISTS tipo_usuario;`);
  }
}
