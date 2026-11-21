import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversationsAndMessages1793000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL,
        tutor_id UUID NOT NULL,
        student_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_conversations_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        CONSTRAINT fk_conversations_tutor FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_conversations_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT uq_conversations_room_tutor_student UNIQUE (room_id, tutor_id, student_id)
      );

      CREATE INDEX idx_conversations_tutor_id ON conversations (tutor_id);
      CREATE INDEX idx_conversations_student_id ON conversations (student_id);

      CREATE TABLE conversation_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL,
        sender_id UUID NOT NULL,
        text TEXT NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_messages_text_length CHECK (char_length(text) BETWEEN 1 AND 2000)
      );

      CREATE INDEX idx_messages_conversation_sent_at ON conversation_messages (conversation_id, sent_at DESC, id DESC);
      CREATE INDEX idx_messages_sender_id ON conversation_messages (sender_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS conversation_messages;
      DROP TABLE IF EXISTS conversations;
    `);
  }
}
