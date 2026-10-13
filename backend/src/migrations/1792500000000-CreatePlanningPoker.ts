import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanningPoker1792500000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE poker_order AS ENUM ('SEQUENTIAL', 'MANUAL');
      CREATE TYPE poker_status AS ENUM ('OPEN', 'CLOSED');
      CREATE TYPE poker_round_status AS ENUM ('VOTING', 'REVEALED', 'DECIDED');

      CREATE TABLE poker_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        anonymous boolean NOT NULL,
        order_mode poker_order NOT NULL,
        status poker_status NOT NULL DEFAULT 'OPEN',
        queue uuid[] NOT NULL DEFAULT '{}',
        created_by uuid NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
        created_at timestamptz NOT NULL DEFAULT now(),
        closed_by uuid REFERENCES users(id) ON DELETE NO ACTION,
        closed_at timestamptz
      );
      CREATE UNIQUE INDEX uq_poker_sessions_open ON poker_sessions(session_id)
        WHERE status = 'OPEN';

      CREATE TABLE poker_rounds (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        poker_id uuid NOT NULL REFERENCES poker_sessions(id) ON DELETE CASCADE,
        student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        round_number smallint NOT NULL CHECK (round_number >= 1),
        status poker_round_status NOT NULL DEFAULT 'VOTING',
        seats jsonb NOT NULL,
        average numeric(4, 2) CHECK (average BETWEEN 0 AND 10),
        final_grade numeric(4, 2) CHECK (final_grade BETWEEN 0 AND 10),
        adjusted boolean NOT NULL DEFAULT false,
        justification varchar(500),
        decided_by uuid REFERENCES users(id) ON DELETE NO ACTION,
        decided_at timestamptz,
        opened_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_poker_rounds_student UNIQUE (poker_id, student_id),
        CONSTRAINT ck_poker_rounds_decision CHECK (
          (status = 'DECIDED') = (final_grade IS NOT NULL AND decided_at IS NOT NULL)
        ),
        CONSTRAINT ck_poker_rounds_justification CHECK (
          NOT adjusted OR char_length(justification) BETWEEN 10 AND 500
        )
      );
      CREATE UNIQUE INDEX uq_poker_rounds_open ON poker_rounds(poker_id)
        WHERE status <> 'DECIDED';

      CREATE TABLE poker_votes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id uuid NOT NULL REFERENCES poker_rounds(id) ON DELETE CASCADE,
        voter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score numeric(4, 2) NOT NULL CHECK (score BETWEEN 0 AND 10),
        voted_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_poker_votes_round_voter UNIQUE (round_id, voter_id)
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE poker_votes;
      DROP TABLE poker_rounds;
      DROP TABLE poker_sessions;
      DROP TYPE poker_round_status;
      DROP TYPE poker_status;
      DROP TYPE poker_order;
    `);
  }
}
