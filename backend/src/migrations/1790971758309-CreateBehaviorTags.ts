import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateBehaviorTags1790971758309 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE behavior_tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tutor_id UUID DEFAULT NULL,
            nome VARCHAR(80) NOT NULL,
            ativa BOOLEAN NOT NULL DEFAULT true,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),

            CONSTRAINT fk_behavior_tags_tutor
              FOREIGN KEY (tutor_id)
              REFERENCES users(id)
              ON DELETE CASCADE,

            CONSTRAINT uq_behavior_tags_tutor_nome UNIQUE (tutor_id, nome)
          );

          CREATE INDEX idx_behavior_tags_tutor_id ON behavior_tags(tutor_id);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS behavior_tags;');
  }
}
