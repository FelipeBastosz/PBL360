import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Conversation } from '../../domain/entities/conversation.entity';
import type {
  ConversationListItem,
  ConversationRepository,
  FindOrCreateConversationResult,
} from '../../domain/repositories/conversation.repository';
import type { UserType } from '@/users/domain/enums/user-type.enum';

interface RawConversationListRow {
  id: string;
  interlocutorId: string;
  interlocutorName: string;
  interlocutorType: UserType;
  interlocutorHasPhoto: boolean;
  lastMessageText: string | null;
  lastMessageSentAt: Date | null;
}

const LIST_ROOM_CONVERSATIONS_QUERY = `
  SELECT
    c.id AS "id",
    u.id AS "interlocutorId",
    u.name AS "interlocutorName",
    u.type AS "interlocutorType",
    EXISTS (SELECT 1 FROM user_photos up WHERE up.user_id = u.id) AS "interlocutorHasPhoto",
    lm.text AS "lastMessageText",
    lm.sent_at AS "lastMessageSentAt"
  FROM conversations c
  INNER JOIN users u ON u.id = CASE WHEN c.tutor_id = $2 THEN c.student_id ELSE c.tutor_id END
  LEFT JOIN LATERAL (
    SELECT m.text, m.sent_at
    FROM conversation_messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.sent_at DESC, m.id DESC
    LIMIT 1
  ) lm ON TRUE
  WHERE c.room_id = $1
    AND (c.tutor_id = $2 OR c.student_id = $2)
  ORDER BY lm.sent_at DESC NULLS LAST, c.created_at DESC;
`;

const INSERT_CONVERSATION_QUERY = `
  INSERT INTO conversations (room_id, tutor_id, student_id)
  VALUES ($1, $2, $3)
  ON CONFLICT (room_id, tutor_id, student_id) DO NOTHING
  RETURNING id, room_id AS "roomId", tutor_id AS "tutorId", student_id AS "studentId",
            created_at AS "createdAt", updated_at AS "updatedAt";
`;

@Injectable()
export class PgConversationRepository implements ConversationRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<Conversation | null> {
    return this.dataSource.getRepository(Conversation).findOne({
      where: { id },
      relations: ['tutor', 'student', 'room'],
    });
  }

  async findByRoomTutorAndStudent(
    roomId: string,
    tutorId: string,
    studentId: string,
  ): Promise<Conversation | null> {
    return this.dataSource.getRepository(Conversation).findOne({
      where: { roomId, tutorId, studentId },
      relations: ['tutor', 'student', 'room'],
    });
  }

  async findOrCreate(
    roomId: string,
    tutorId: string,
    studentId: string,
  ): Promise<FindOrCreateConversationResult> {
    const existing = await this.findByRoomTutorAndStudent(roomId, tutorId, studentId);
    if (existing) {
      return { conversation: existing, created: false };
    }

    const inserted = await this.insertIfAbsent(roomId, tutorId, studentId);
    if (inserted) {
      return { conversation: inserted, created: true };
    }

    const conflicted = await this.findByRoomTutorAndStudent(roomId, tutorId, studentId);
    if (!conflicted) {
      throw new Error('Falha ao obter ou criar conversa.');
    }
    return { conversation: conflicted, created: false };
  }

  private async insertIfAbsent(
    roomId: string,
    tutorId: string,
    studentId: string,
  ): Promise<Conversation | null> {
    const rows = await this.dataSource.query<Conversation[]>(INSERT_CONVERSATION_QUERY, [
      roomId,
      tutorId,
      studentId,
    ]);
    return rows[0] ?? null;
  }

  async listByRoomAndUser(roomId: string, userId: string): Promise<ConversationListItem[]> {
    const rows = await this.dataSource.query<RawConversationListRow[]>(
      LIST_ROOM_CONVERSATIONS_QUERY,
      [roomId, userId],
    );
    return rows.map((row) => this.toListItem(row));
  }

  private toListItem(row: RawConversationListRow): ConversationListItem {
    return {
      id: row.id,
      interlocutor: {
        id: row.interlocutorId,
        name: row.interlocutorName,
        type: row.interlocutorType,
        hasPhoto: Boolean(row.interlocutorHasPhoto),
      },
      lastMessage: row.lastMessageText
        ? {
            text: row.lastMessageText,
            sentAt: new Date(row.lastMessageSentAt!),
          }
        : null,
    };
  }
}
