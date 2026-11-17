import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity('conversation_messages')
@Index('idx_messages_conversation_sent_at', ['conversationId', 'sentAt', 'id'])
@Check('chk_messages_text_length', 'char_length(text) BETWEEN 1 AND 2000')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'conversation_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_messages_conversation',
  })
  conversation?: Conversation;

  @Index('idx_messages_sender_id')
  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'sender_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_messages_sender',
  })
  sender?: User;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamptz' })
  sentAt: Date;
}
