import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendances1791300000000 implements MigrationInterface {
  name = 'CreateAttendances1791300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');`,
    );
    await queryRunner.query(`
      CREATE TABLE attendances (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        student_id UUID NOT NULL,
        recorded_by UUID NOT NULL,
        status attendance_status NOT NULL,
        justification VARCHAR(500),
        seat_number SMALLINT,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_attendances PRIMARY KEY (id),
        CONSTRAINT uq_attendances_session_student UNIQUE (session_id, student_id),
        CONSTRAINT uq_attendances_session_seat UNIQUE (session_id, seat_number),
        CONSTRAINT fk_attendances_session
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        CONSTRAINT fk_attendances_student
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_attendances_recorded_by
          FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE NO ACTION,
        CONSTRAINT ck_attendances_seat_positive
          CHECK (seat_number IS NULL OR seat_number >= 1),
        CONSTRAINT ck_attendances_seat_only_when_present
          CHECK (seat_number IS NULL OR status IN ('PRESENT', 'LATE')),
        CONSTRAINT ck_attendances_justification_only_when_excused
          CHECK (justification IS NULL OR status = 'EXCUSED')
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_attendances_student_id ON attendances(student_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS attendances;`);
    await queryRunner.query(`DROP TYPE IF EXISTS attendance_status;`);
  }
}
