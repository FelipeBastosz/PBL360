import { getMetadataArgsStorage } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

describe('Message mapping', () => {
  it('maps the conversation and sender relationships', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (relation) => relation.target === Message,
    );
    const targets = relations.map((relation) =>
      typeof relation.type === 'function' ? (relation.type() as unknown) : relation.type,
    );
    const conversation = relations.find((relation) => relation.propertyName === 'conversation');
    const inverse = conversation?.inverseSideProperty as
      ((conversation: { messages: string[] }) => string[]) | undefined;

    expect(targets).toEqual([Conversation, User]);
    expect(inverse?.({ messages: ['message-1'] })).toEqual(['message-1']);
  });
});
