import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignBehaviorTagsWithErd1791231436311 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE behavior_tags RENAME COLUMN nome TO name;
      ALTER TABLE behavior_tags RENAME COLUMN ativa TO active;
      ALTER TABLE behavior_tags RENAME COLUMN criado_em TO created_at;
      ALTER TABLE behavior_tags RENAME CONSTRAINT uq_behavior_tags_tutor_nome TO uq_behavior_tags_tutor_name;
      ALTER TABLE behavior_tags ADD COLUMN color VARCHAR(7);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE behavior_tags DROP COLUMN color;
      ALTER TABLE behavior_tags RENAME CONSTRAINT uq_behavior_tags_tutor_name TO uq_behavior_tags_tutor_nome;
      ALTER TABLE behavior_tags RENAME COLUMN created_at TO criado_em;
      ALTER TABLE behavior_tags RENAME COLUMN active TO ativa;
      ALTER TABLE behavior_tags RENAME COLUMN name TO nome;
    `);
  }
}
