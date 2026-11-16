import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Message } from '../../domain/entities/message.entity';
import type {
  ListMessagesOptions,
  ListMessagesResult,
  MessageRepository,
} from '../../domain/repositories/message.repository';
import { User } from '@/users/domain/entities/user.entity';

interface RawMessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: Date;
  senderName: string;
}

const INSERT_MESSAGE_QUERY = `
  WITH inserted AS (
    INSERT INTO conversation_messages (conversation_id, sender_id, text)
    VALUES ($1, $2, $3)
    RETURNING id, conversation_id AS "conversationId", sender_id AS "senderId", text, sent_at AS "sentAt"
  ), updated_conv AS (
    UPDATE conversations
    SET updated_at = (SELECT "sentAt" FROM inserted)
    WHERE id = $1
  )
  SELECT i.id, i."conversationId", i."senderId", i.text, i."sentAt", u.name AS "senderName"
  FROM inserted i
  INNER JOIN users u ON u.id = i."senderId";
`;

const LIST_AFTER_QUERY = `
  SELECT m.id, m.conversation_id AS "conversationId", m.sender_id AS "senderId",
         m.text, m.sent_at AS "sentAt", u.name AS "senderName"
  FROM conversation_messages m
  INNER JOIN users u ON u.id = m.sender_id
  WHERE m.conversation_id = $1
    AND (m.sent_at, m.id) > (
      SELECT ref.sent_at, ref.id FROM conversation_messages ref WHERE ref.id = $2
    )
  ORDER BY m.sent_at ASC, m.id ASC
  LIMIT $3;
`;

const LIST_CURSOR_QUERY = `
  SELECT m.id, m.conversation_id AS "conversationId", m.sender_id AS "senderId",
         m.text, m.sent_at AS "sentAt", u.name AS "senderName"
  FROM conversation_messages m
  INNER JOIN users u ON u.id = m.sender_id
  WHERE m.conversation_id = $1
    AND (m.sent_at, m.id) < (
      SELECT ref.sent_at, ref.id FROM conversation_messages ref WHERE ref.id = $2
    )
  ORDER BY m.sent_at DESC, m.id DESC
  LIMIT $3;
`;

const LIST_LATEST_QUERY = `
  SELECT m.id, m.conversation_id AS "conversationId", m.sender_id AS "senderId",
         m.text, m.sent_at AS "sentAt", u.name AS "senderName"
  FROM conversation_messages m
  INNER JOIN users u ON u.id = m.sender_id
  WHERE m.conversation_id = $1
  ORDER BY m.sent_at DESC, m.id DESC
  LIMIT $2;
`;

@Injectable()
export class PgMessageRepository implements MessageRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<Message | null> {
    return this.dataSource.getRepository(Message).findOne({
      where: { id },
      relations: ['sender'],
    });
  }

  async create(conversationId: string, senderId: string, text: string): Promise<Message> {
    const rows = await this.dataSource.query<RawMessageRow[]>(INSERT_MESSAGE_QUERY, [
      conversationId,
      senderId,
      text,
    ]);
    const row = rows[0];
    if (!row) {
      throw new Error('Falha ao gravar mensagem.');
    }
    return this.toMessageEntity(row);
  }

  async listByConversation(
    conversationId: string,
    options: ListMessagesOptions,
  ): Promise<ListMessagesResult> {
    const { cursor, afterId, limit } = options;

    if (afterId) {
      return this.listAfter(conversationId, afterId, limit);
    }

    if (cursor) {
      return this.listWithCursor(conversationId, cursor, limit);
    }

    return this.listLatest(conversationId, limit);
  }

  private async listAfter(
    conversationId: string,
    afterId: string,
    limit: number,
  ): Promise<ListMessagesResult> {
    const rows = await this.dataSource.query<RawMessageRow[]>(LIST_AFTER_QUERY, [
      conversationId,
      afterId,
      limit,
    ]);
    return { messages: rows.map((r) => this.toMessageEntity(r)), nextCursor: null };
  }

  private async listWithCursor(
    conversationId: string,
    cursor: string,
    limit: number,
  ): Promise<ListMessagesResult> {
    const rows = await this.dataSource.query<RawMessageRow[]>(LIST_CURSOR_QUERY, [
      conversationId,
      cursor,
      limit + 1,
    ]);
    return this.paginateDescRows(rows, limit);
  }

  private async listLatest(conversationId: string, limit: number): Promise<ListMessagesResult> {
    const rows = await this.dataSource.query<RawMessageRow[]>(LIST_LATEST_QUERY, [
      conversationId,
      limit + 1,
    ]);
    return this.paginateDescRows(rows, limit);
  }

  private paginateDescRows(rows: RawMessageRow[], limit: number): ListMessagesResult {
    const hasMore = rows.length > limit;
    const targetRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && targetRows.length > 0 ? targetRows[targetRows.length - 1]!.id : null;

    const messages = targetRows.reverse().map((r) => this.toMessageEntity(r));
    return { messages, nextCursor };
  }

  private toMessageEntity(row: RawMessageRow): Message {
    const message = new Message();
    message.id = row.id;
    message.conversationId = row.conversationId;
    message.senderId = row.senderId;
    message.text = row.text;
    message.sentAt = new Date(row.sentAt);

    const sender = new User();
    sender.id = row.senderId;
    sender.name = row.senderName;
    message.sender = sender;

    return message;
  }
}
