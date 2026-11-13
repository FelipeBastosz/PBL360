import {
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
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_messages_conversation_id')
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
