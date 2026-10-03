import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionRoles1791200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE session_role AS ENUM ('COORDINATOR', 'BOARD_SECRETARY', 'TABLE_SECRETARY');
      CREATE TABLE session_roles (
        session_id UUID NOT NULL,
        student_id UUID NOT NULL,
        role session_role NOT NULL,
        bonus_score NUMERIC(3, 2),
        CONSTRAINT pk_session_roles PRIMARY KEY (session_id, student_id),
        CONSTRAINT uq_session_roles_session_role UNIQUE (session_id, role),
        CONSTRAINT fk_session_roles_session
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        CONSTRAINT fk_session_roles_student
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT ck_session_roles_bonus_score
          CHECK (bonus_score IS NULL OR (bonus_score >= 0 AND bonus_score <= 1))
      );
      CREATE INDEX idx_session_roles_student_id ON session_roles(student_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS session_roles;`);
    await queryRunner.query(`DROP TYPE IF EXISTS session_role;`);
  }
}
