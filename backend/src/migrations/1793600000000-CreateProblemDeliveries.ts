import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProblemDeliveries1793600000000 implements MigrationInterface {
  name = 'CreateProblemDeliveries1793600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE problem_deliveries (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL,
        problem_id UUID NOT NULL,
        submitted_by UUID NOT NULL,
        url VARCHAR(2048) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        replaced_at TIMESTAMPTZ NULL DEFAULT NULL,
        CONSTRAINT pk_problem_deliveries PRIMARY KEY (id),
        CONSTRAINT fk_problem_deliveries_room
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        CONSTRAINT fk_problem_deliveries_problem
          FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
        CONSTRAINT fk_problem_deliveries_submitted_by
          FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_problem_deliveries_url_https
          CHECK (char_length(trim(url)) BETWEEN 1 AND 2048 AND url ~* '^https://')
      );

      CREATE UNIQUE INDEX uq_problem_deliveries_active_student
        ON problem_deliveries (problem_id, submitted_by)
        WHERE replaced_at IS NULL;
      CREATE INDEX idx_problem_deliveries_problem_active
        ON problem_deliveries (problem_id, created_at DESC, id DESC)
        WHERE replaced_at IS NULL;
      CREATE INDEX idx_problem_deliveries_room_problem
        ON problem_deliveries (room_id, problem_id);
      CREATE INDEX idx_problem_deliveries_submitted_by
        ON problem_deliveries (submitted_by);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS problem_deliveries;`);
  }
}
