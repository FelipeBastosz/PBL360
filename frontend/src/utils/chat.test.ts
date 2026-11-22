import { describe, expect, it } from 'vitest';
import type { ChatMessage, Conversation } from '@/types/conversation';
import {
  buildChatContacts,
  describeListChange,
  formatMessageTime,
  hasUnreadMessage,
  isLaterThan,
  isNearBottom,
  isNearTop,
  mergeMessages,
  splitContacts,
} from './chat';

const conversationWith = (personId: string, sentAt: string | null): Conversation => ({
  id: `conv-${personId}`,
  interlocutor: { id: personId, nome: personId, tipo: 'ALUNO', possuiFoto: true },
  ultimaMensagem: sentAt ? { texto: 'Oi', enviadaEm: sentAt } : null,
});

const message = (id: string): ChatMessage => ({
  id,
  remetente: { id: 'u1', nome: 'Ana' },
  texto: id,
  enviadaEm: '2026-11-16T10:00:00.000Z',
});

const people = [
  { id: 'c', nome: 'Carla', descricao: 'Aluno' },
  { id: 'a', nome: 'Ana', descricao: 'Aluno' },
  { id: 'b', nome: 'Bruno', descricao: 'Aluno' },
];

describe('buildChatContacts', () => {
  it('attaches each conversation to its interlocutor and keeps people without one', () => {
    const contacts = buildChatContacts(people, [conversationWith('a', null)]);

    expect(contacts.find((c) => c.id === 'a')).toMatchObject({ possuiFoto: true });
    expect(contacts.find((c) => c.id === 'b')).toMatchObject({ conversation: null });
  });
});

describe('splitContacts', () => {
  it('lists who already talked newest first and the others alphabetically', () => {
    const contacts = buildChatContacts(people, [
      conversationWith('c', '2026-11-15T10:00:00.000Z'),
      conversationWith('b', '2026-11-16T10:00:00.000Z'),
    ]);

    const { recent, others } = splitContacts(contacts);

    expect(recent.map((c) => c.id)).toEqual(['b', 'c']);
    expect(others.map((c) => c.id)).toEqual(['a']);
  });

  it('keeps an opened conversation with no message among the others', () => {
    const { recent, others } = splitContacts(
      buildChatContacts(people, [conversationWith('a', null)]),
    );

    expect(recent).toEqual([]);
    expect(others).toHaveLength(3);
  });
});

describe('hasUnreadMessage', () => {
  const conversation = conversationWith('a', '2026-11-16T10:00:00.000Z');

  it('is unread when the conversation was never seen', () => {
    expect(hasUnreadMessage(conversation)).toBe(true);
  });

  it('is unread only when the last message is newer than the last visit', () => {
    expect(hasUnreadMessage(conversation, '2026-11-16T09:00:00.000Z')).toBe(true);
    expect(hasUnreadMessage(conversation, '2026-11-16T10:00:00.000Z')).toBe(false);
  });

  it('is never unread without messages', () => {
    expect(hasUnreadMessage(conversationWith('a', null))).toBe(false);
  });
});

describe('isLaterThan', () => {
  it('compares instants and accepts a missing reference', () => {
    expect(isLaterThan('2026-11-16T10:00:00.000Z')).toBe(true);
    expect(isLaterThan('2026-11-16T10:00:00.000Z', '2026-11-16T11:00:00.000Z')).toBe(false);
  });
});

describe('mergeMessages', () => {
  it('keeps the order of both lists without repeating a message', () => {
    const merged = mergeMessages([message('1'), message('2')], [message('2'), message('3')]);

    expect(merged.map((m) => m.id)).toEqual(['1', '2', '3']);
  });
});

describe('formatMessageTime', () => {
  const now = new Date(2026, 10, 16, 18, 0);

  it('shows only the time for a message sent today', () => {
    expect(formatMessageTime(new Date(2026, 10, 16, 9, 5).toISOString(), now)).toBe('09:05');
  });

  it('adds the day for an older message', () => {
    expect(formatMessageTime(new Date(2026, 10, 3, 14, 30).toISOString(), now)).toBe('03/11 14:30');
  });
});

describe('isNearBottom', () => {
  it('treats the end of the list and a few pixels above it as the bottom', () => {
    expect(isNearBottom({ scrollHeight: 1000, clientHeight: 300, scrollTop: 700 })).toBe(true);
    expect(isNearBottom({ scrollHeight: 1000, clientHeight: 300, scrollTop: 640 })).toBe(true);
  });

  it('is false while the reader is up in the history', () => {
    expect(isNearBottom({ scrollHeight: 1000, clientHeight: 300, scrollTop: 200 })).toBe(false);
  });
});

describe('describeListChange', () => {
  it('spots the first load, older messages at the top and newer ones at the end', () => {
    expect(describeListChange({}, { firstId: '1', lastId: '2' })).toBe('initial');
    expect(describeListChange({ firstId: '3', lastId: '4' }, { firstId: '1', lastId: '4' })).toBe(
      'older',
    );
    expect(describeListChange({ firstId: '1', lastId: '2' }, { firstId: '1', lastId: '3' })).toBe(
      'newer',
    );
    expect(describeListChange({ firstId: '1', lastId: '2' }, { firstId: '1', lastId: '2' })).toBe(
      'none',
    );
  });

  it('does nothing while the conversation is still empty', () => {
    expect(describeListChange({}, {})).toBe('none');
  });
});

describe('isNearTop', () => {
  it('is true close to the beginning of the history', () => {
    expect(isNearTop({ scrollTop: 0 })).toBe(true);
    expect(isNearTop({ scrollTop: 120 })).toBe(true);
    expect(isNearTop({ scrollTop: 400 })).toBe(false);
  });
});
