import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomTutors1790182316665 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE room_tutors (
        room_id UUID NOT NULL,
        tutor_id UUID NOT NULL,

        CONSTRAINT pk_room_tutors
          PRIMARY KEY (room_id, tutor_id),

        CONSTRAINT fk_room_tutors_room
          FOREIGN KEY (room_id)
          REFERENCES rooms(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_room_tutors_tutor
          FOREIGN KEY (tutor_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      INSERT INTO room_tutors (
        room_id,
        tutor_id
      )
      SELECT
        id,
        tutor_id
      FROM rooms;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS room_tutors;
    `);
  }
}
