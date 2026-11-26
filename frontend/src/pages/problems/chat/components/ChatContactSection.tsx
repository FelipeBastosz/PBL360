import type { ChatContact, SeenMap } from '@/utils/chat';
import { hasUnreadMessage } from '@/utils/chat';
import { ChatContactItem } from './ChatContactItem';

type ChatContactSectionProps = {
  title: string;
  contacts: ChatContact[];
  selectedId: string | null;
  seen: SeenMap;
  canSeePhotos: boolean;
  onSelect: (contactId: string) => void;
};

export function ChatContactSection({
  title,
  contacts,
  selectedId,
  seen,
  canSeePhotos,
  onSelect,
}: ChatContactSectionProps) {
  if (contacts.length === 0) return null;

  return (
    <section aria-label={title} className="flex flex-col">
      <h3 className="px-4 pt-4 pb-1 text-xs font-bold tracking-wide text-muted uppercase">
        {title}
      </h3>
      <ul className="flex flex-col">
        {contacts.map((contact) => (
          <ChatContactItem
            key={contact.id}
            contact={contact}
            isSelected={contact.id === selectedId}
            isUnread={Boolean(
              contact.conversation &&
              hasUnreadMessage(contact.conversation, seen[contact.conversation.id]),
            )}
            canSeePhoto={canSeePhotos}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </section>
  );
}
