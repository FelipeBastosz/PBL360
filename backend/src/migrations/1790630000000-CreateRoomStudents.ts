import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomStudents1790630000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE room_students (
        room_id UUID NOT NULL,
        student_id UUID NOT NULL,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_room_students PRIMARY KEY (room_id, student_id),
        CONSTRAINT fk_room_students_room
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        CONSTRAINT fk_room_students_student
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_room_students_student ON room_students(student_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS room_students;`);
  }
}
