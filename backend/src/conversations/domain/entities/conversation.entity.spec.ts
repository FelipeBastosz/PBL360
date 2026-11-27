import { getMetadataArgsStorage } from 'typeorm';
import { Room } from '@/rooms/domain/entities/room.entity';
import { User } from '@/users/domain/entities/user.entity';
import { Message } from './message.entity';
import { Conversation } from './conversation.entity';

describe('Conversation mapping', () => {
  it('maps its room, participants and message collection', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (relation) => relation.target === Conversation,
    );
    const targets = relations.map((relation) =>
      typeof relation.type === 'function' ? (relation.type() as unknown) : relation.type,
    );
    const messages = relations.find((relation) => relation.propertyName === 'messages');
    const inverse = messages?.inverseSideProperty as
      ((message: { conversation: string }) => string) | undefined;

    expect(targets).toEqual([Room, User, User, Message]);
    expect(inverse?.({ conversation: 'conversation-1' })).toBe('conversation-1');
  });
});
