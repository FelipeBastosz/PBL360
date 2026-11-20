import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/utils/cn';
import type { ChatContact } from '@/utils/chat';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

type ChatContactItemProps = {
  contact: ChatContact;
  isSelected: boolean;
  isUnread: boolean;
  canSeePhoto: boolean;
  onSelect: (contactId: string) => void;
};

export function ChatContactItem({
  contact,
  isSelected,
  isUnread,
  canSeePhoto,
  onSelect,
}: ChatContactItemProps) {
  const lastMessage = contact.conversation?.ultimaMensagem;
  const avatarUser = { ...contact, possuiFoto: canSeePhoto && contact.possuiFoto };

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(contact.id)}
        aria-current={isSelected || undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-900',
          isSelected && 'bg-brand-50',
        )}
      >
        <UserAvatar user={avatarUser} className="size-11" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline gap-2">
            <span className="flex-1 truncate text-sm font-semibold text-ink">{contact.nome}</span>
            {lastMessage && (
              <span className="shrink-0 text-xs text-muted">
                {formatRelativeTime(lastMessage.enviadaEm)}
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'flex-1 truncate text-sm text-muted',
                isUnread && 'font-semibold text-ink',
              )}
            >
              {lastMessage?.texto ?? contact.descricao}
            </span>
            {isUnread && (
              <span className="size-2.5 shrink-0 rounded-full bg-brand-900">
                <span className="sr-only">Nova mensagem</span>
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}
