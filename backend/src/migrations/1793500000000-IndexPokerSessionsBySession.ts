import type { MigrationInterface, QueryRunner } from 'typeorm';

export class IndexPokerSessionsBySession1793500000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX idx_poker_sessions_session_id ON poker_sessions(session_id);',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_poker_sessions_session_id;');
  }
}
