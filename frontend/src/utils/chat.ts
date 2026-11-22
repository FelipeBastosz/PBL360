import type { ChatMessage, Conversation } from '@/types/conversation';

export type ChatPerson = {
  id: string;
  nome: string;
  descricao: string;
};

export type ChatContact = ChatPerson & {
  possuiFoto: boolean;
  conversation: Conversation | null;
};

export type SeenMap = Record<string, string>;

const lastSentAt = (contact: ChatContact) => contact.conversation?.ultimaMensagem?.enviadaEm ?? '';

const hasMessages = (contact: ChatContact) => Boolean(contact.conversation?.ultimaMensagem);

export function buildChatContacts(people: ChatPerson[], conversations: Conversation[]) {
  const byPerson = new Map(conversations.map((item) => [item.interlocutor.id, item]));
  return people.map((person): ChatContact => {
    const conversation = byPerson.get(person.id) ?? null;
    return { ...person, possuiFoto: conversation?.interlocutor.possuiFoto ?? false, conversation };
  });
}

// "Recent" holds whoever already exchanged a message, newest first; the rest is alphabetical.
export function splitContacts(contacts: ChatContact[]) {
  const recent = contacts
    .filter(hasMessages)
    .sort((a, b) => new Date(lastSentAt(b)).getTime() - new Date(lastSentAt(a)).getTime());
  const others = contacts
    .filter((contact) => !hasMessages(contact))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return { recent, others };
}

export function hasUnreadMessage(conversation: Conversation, seenAt?: string): boolean {
  const sentAt = conversation.ultimaMensagem?.enviadaEm;
  if (!sentAt) return false;
  return !seenAt || new Date(sentAt).getTime() > new Date(seenAt).getTime();
}

export function isLaterThan(candidate: string, reference?: string): boolean {
  return !reference || new Date(candidate).getTime() > new Date(reference).getTime();
}

// Keeps `first` before `second` and drops repeated ids, so polling and a send that race
// each other never show the same message twice.
export function mergeMessages(first: ChatMessage[], second: ChatMessage[]): ChatMessage[] {
  const known = new Set(first.map((message) => message.id));
  return [...first, ...second.filter((message) => !known.has(message.id))];
}

type ScrollMetrics = Pick<HTMLElement, 'scrollHeight' | 'scrollTop' | 'clientHeight'>;

// Close enough to the end counts as "at the end": a few pixels of rounding or a half-visible
// last bubble should not stop the list from following new messages.
const NEAR_BOTTOM_PX = 80;

export function isNearBottom({ scrollHeight, scrollTop, clientHeight }: ScrollMetrics): boolean {
  return scrollHeight - scrollTop - clientHeight <= NEAR_BOTTOM_PX;
}

type ListEnds = { firstId?: string; lastId?: string };

export type ListChange = 'initial' | 'older' | 'newer' | 'none';

// What changed between two renders of a conversation, judged by its first and last messages.
export function describeListChange(before: ListEnds, after: ListEnds): ListChange {
  if (!before.lastId) return after.lastId ? 'initial' : 'none';
  if (after.lastId !== before.lastId) return 'newer';
  if (after.firstId !== before.firstId) return 'older';
  return 'none';
}

// How close to the top the reader gets before the previous page is requested, so it is
// usually in place before they reach the very first message on screen.
const NEAR_TOP_PX = 120;

export function isNearTop({ scrollTop }: Pick<HTMLElement, 'scrollTop'>): boolean {
  return scrollTop <= NEAR_TOP_PX;
}

const pad = (value: number) => String(value).padStart(2, '0');

export function formatMessageTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (date.toDateString() === now.toDateString()) return time;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${time}`;
}
