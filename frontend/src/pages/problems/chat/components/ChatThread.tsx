import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { ChatContact } from '@/utils/chat';
import { useChatThread } from '../hooks/useChatThread';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';

type ChatThreadProps = {
  roomId: string;
  contact: ChatContact;
  currentUserId: string;
  canSeePhoto: boolean;
  onBack: () => void;
  onSeen: (conversationId: string, sentAt: string) => void;
  onActivity: () => void;
};

function ChatThreadHeader({
  contact,
  canSeePhoto,
  onBack,
}: Pick<ChatThreadProps, 'contact' | 'canSeePhoto' | 'onBack'>) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-ink/10 bg-white px-3 lg:h-18 lg:px-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar para conversas"
        className="rounded-full p-2 text-ink transition-[background-color,scale] duration-200 hover:bg-black/5 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900 lg:hidden"
      >
        <ChevronLeftIcon className="size-6" aria-hidden />
      </button>
      <UserAvatar
        user={{ ...contact, possuiFoto: canSeePhoto && contact.possuiFoto }}
        className="size-10"
      />
      <div className="flex min-w-0 flex-col">
        <h3 className="truncate text-base font-semibold text-ink">{contact.nome}</h3>
        <span className="truncate text-sm text-muted">{contact.descricao}</span>
      </div>
    </header>
  );
}

export function ChatThread({
  roomId,
  contact,
  currentUserId,
  canSeePhoto,
  onBack,
  onSeen,
  onActivity,
}: ChatThreadProps) {
  const thread = useChatThread({ roomId, contact, onSeen, onActivity });

  return (
    <>
      <ChatThreadHeader contact={contact} canSeePhoto={canSeePhoto} onBack={onBack} />
      <ChatMessageList
        messages={thread.messages}
        currentUserId={currentUserId}
        recipientName={contact.nome}
        isLoading={thread.isLoading}
        error={thread.error}
        hasOlder={thread.hasOlder}
        isLoadingOlder={thread.isLoadingOlder}
        onLoadOlder={thread.loadOlder}
      />
      {thread.sendError && (
        <Alert tone="error" className="mx-4 mb-2">
          {thread.sendError.message}
        </Alert>
      )}
      <ChatComposer
        recipientName={contact.nome}
        isSending={thread.isSending}
        onSend={thread.send}
      />
    </>
  );
}
