import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessions1791100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        problem_id UUID NOT NULL,
        title VARCHAR(120) NOT NULL,
        description TEXT DEFAULT NULL,
        date DATE NOT NULL,
        order_index SMALLINT NOT NULL DEFAULT 1,
        status VARCHAR(30) NOT NULL DEFAULT 'agendada',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT uq_sessions_problem_order UNIQUE (problem_id, order_index),
        CONSTRAINT fk_sessions_problem
          FOREIGN KEY (problem_id)
          REFERENCES problems(id)
          ON DELETE CASCADE
      );

      CREATE INDEX idx_sessions_problem_id ON sessions(problem_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS sessions;`);
  }
}
