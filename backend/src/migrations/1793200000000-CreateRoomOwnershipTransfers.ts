import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomOwnershipTransfers1793200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE room_ownership_transfers (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        room_id UUID NOT NULL,
        previous_owner_id UUID NOT NULL,
        new_owner_id UUID NOT NULL,
        transferred_by_id UUID NOT NULL,
        transferred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT fk_room_ownership_transfers_room
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        CONSTRAINT fk_room_ownership_transfers_previous_owner
          FOREIGN KEY (previous_owner_id) REFERENCES users(id),
        CONSTRAINT fk_room_ownership_transfers_new_owner
          FOREIGN KEY (new_owner_id) REFERENCES users(id),
        CONSTRAINT fk_room_ownership_transfers_transferred_by
          FOREIGN KEY (transferred_by_id) REFERENCES users(id),
        CONSTRAINT chk_room_ownership_transfers_distinct_owners
          CHECK (previous_owner_id <> new_owner_id)
      );

      CREATE INDEX idx_room_ownership_transfers_room_id
        ON room_ownership_transfers (room_id, transferred_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS room_ownership_transfers;');
  }
}
