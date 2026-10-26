import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowPeerAndPokerGradeAdjustments1792700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE grade_adjustments
        ADD COLUMN poker_round_id UUID REFERENCES poker_rounds(id) ON DELETE CASCADE,
        ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        ADD COLUMN student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        ADD COLUMN type VARCHAR(30);

      ALTER TABLE grade_adjustments DROP CONSTRAINT ck_grade_adjustments_target;

      ALTER TABLE grade_adjustments ADD CONSTRAINT ck_grade_adjustments_target
        CHECK (
          (evaluation_item_id IS NOT NULL AND evaluation_id IS NULL AND poker_round_id IS NULL AND session_id IS NULL)
          OR (evaluation_id IS NOT NULL AND evaluation_item_id IS NULL AND poker_round_id IS NULL AND session_id IS NULL)
          OR (poker_round_id IS NOT NULL AND evaluation_item_id IS NULL AND evaluation_id IS NULL AND session_id IS NULL)
          OR (session_id IS NOT NULL AND student_id IS NOT NULL AND type IS NOT NULL AND evaluation_item_id IS NULL AND evaluation_id IS NULL AND poker_round_id IS NULL)
        );

      CREATE INDEX idx_grade_adjustments_poker_round ON grade_adjustments(poker_round_id, created_at);
      CREATE INDEX idx_grade_adjustments_peer_session_student ON grade_adjustments(session_id, student_id, created_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_grade_adjustments_peer_session_student;
      DROP INDEX IF EXISTS idx_grade_adjustments_poker_round;
      DELETE FROM grade_adjustments WHERE poker_round_id IS NOT NULL OR session_id IS NOT NULL;
      ALTER TABLE grade_adjustments DROP CONSTRAINT ck_grade_adjustments_target;
      ALTER TABLE grade_adjustments
        DROP COLUMN poker_round_id,
        DROP COLUMN session_id,
        DROP COLUMN student_id,
        DROP COLUMN type;
      ALTER TABLE grade_adjustments ADD CONSTRAINT ck_grade_adjustments_target
        CHECK (num_nonnulls(evaluation_id, evaluation_item_id) = 1);
    `);
  }
}
