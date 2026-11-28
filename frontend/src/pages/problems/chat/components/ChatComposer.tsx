import { type FormEvent, type KeyboardEvent, useId, useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';

const MAX_MESSAGE_LENGTH = 2000;

type ChatComposerProps = {
  recipientName: string;
  isSending: boolean;
  onSend: (text: string) => Promise<boolean>;
};

export function ChatComposer({ recipientName, isSending, onSend }: ChatComposerProps) {
  const [text, setText] = useState('');
  const inputId = useId();
  const canSend = text.trim().length > 0 && !isSending;

  async function submit() {
    if (!canSend) return;
    if (await onSend(text.trim())) setText('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  // Enter sends, Shift+Enter breaks the line; an IME composition is never cut short.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex shrink-0 items-end gap-2 border-t border-border-subtle bg-elevated px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <label htmlFor={inputId} className="sr-only">
        Mensagem para {recipientName}
      </label>
      <textarea
        id={inputId}
        rows={1}
        value={text}
        maxLength={MAX_MESSAGE_LENGTH}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escreva uma mensagem…"
        className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-placeholder focus:border-brand-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Enviar mensagem"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-primary-border bg-brand-primary text-brand-on-primary transition-[background-color,scale,opacity] duration-200 hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        {isSending ? (
          <Spinner className="size-5" />
        ) : (
          <PaperAirplaneIcon className="size-5" aria-hidden />
        )}
      </button>
    </form>
  );
}
