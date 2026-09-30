import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomTutorEvents1791000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE room_tutor_events (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        room_id UUID NOT NULL,
        tutor_id UUID NOT NULL,
        actor_id UUID NOT NULL,
        action VARCHAR(7) NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_room_tutor_events_action CHECK (action IN ('ADDED', 'REMOVED'))
      );

      CREATE INDEX idx_room_tutor_events_room_id ON room_tutor_events (room_id, id);
      CREATE INDEX idx_room_tutor_events_actor_id ON room_tutor_events (actor_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS room_tutor_events;');
  }
}
