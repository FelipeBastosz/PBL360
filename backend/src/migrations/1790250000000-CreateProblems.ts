import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProblems1790250000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE problems (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL,
        title VARCHAR(120) NOT NULL,
        description TEXT DEFAULT NULL,
        order_index SMALLINT NOT NULL DEFAULT 1,
        start_date DATE DEFAULT NULL,
        end_date DATE DEFAULT NULL,
        self_eval_released BOOLEAN NOT NULL DEFAULT FALSE,
        peer_eval_released BOOLEAN NOT NULL DEFAULT FALSE,
        released_at TIMESTAMPTZ DEFAULT NULL,
        self_eval_deadline TIMESTAMPTZ DEFAULT NULL,
        created_by UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT NULL,

        CONSTRAINT uq_problems_room_order UNIQUE (room_id, order_index),
        CONSTRAINT fk_problems_room
          FOREIGN KEY (room_id)
          REFERENCES rooms(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_problems_created_by
          FOREIGN KEY (created_by)
          REFERENCES users(id)
      );

      CREATE INDEX idx_problems_room_id ON problems(room_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS problems;`);
  }
}
