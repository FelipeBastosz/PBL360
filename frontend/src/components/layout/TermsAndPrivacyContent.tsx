import type { ReactNode } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { LIVE_TERM_LOAD_ERROR, useCurrentTerm } from '@/hooks/useCurrentTerm';
import type { CurrentCommitmentTerm } from '@/services/commitmentTerms.service';

export type TermsAndPrivacyContentProps = {
  term?: CurrentCommitmentTerm | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  requireLiveTerm?: boolean;
  onTermLoaded?: (term: CurrentCommitmentTerm) => void;
};

function cleanMailtoSyntax(text: string): string {
  return text.replace(/\[([^\]]+)\]\(mailto:[^)]+\)/g, '$1');
}

function renderToken(token: string, key: number): ReactNode {
  if (token.startsWith('**') && token.endsWith('**')) {
    return (
      <strong key={key} className="text-brand-accent font-semibold">
        {token.slice(2, -2)}
      </strong>
    );
  }
  if (token.startsWith('*') && token.endsWith('*')) {
    return (
      <em key={key} className="italic">
        {token.slice(1, -1)}
      </em>
    );
  }
  if (token.startsWith('http://') || token.startsWith('https://')) {
    return (
      <a
        key={key}
        href={token}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-brand-accent underline underline-offset-2 hover:opacity-80"
      >
        {token}
      </a>
    );
  }
  return token;
}

function renderInlineText(text: string): ReactNode[] {
  const cleaned = cleanMailtoSyntax(text);
  const parts: ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleaned.slice(lastIndex, match.index));
    }
    parts.push(renderToken(match[0], match.index));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    parts.push(cleaned.slice(lastIndex));
  }

  return parts;
}

function renderBlock(block: string, index: number): ReactNode {
  const trimmed = block.trim();
  if (!trimmed || trimmed.startsWith('# ')) return null;

  if (trimmed === '---') {
    return <hr key={index} className="border-border-subtle my-1" />;
  }

  if (trimmed.startsWith('>')) {
    const cleanContent = trimmed
      .split('\n')
      .map((line) => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();
    const titleMatch = cleanContent.match(/^###\s+(.*)/m);
    const title = titleMatch ? titleMatch[1] : '';
    const body = cleanContent.replace(/^###\s+.*$/m, '').trim();

    return (
      <section
        key={index}
        className="flex flex-col gap-1.5 rounded-xl border border-warning-line bg-warning-soft p-3 text-xs"
      >
        {title ? (
          <h3 className="font-semibold uppercase tracking-wide text-warning">{title}</h3>
        ) : null}
        <p className="font-medium leading-relaxed text-ink">{renderInlineText(body)}</p>
      </section>
    );
  }

  if (trimmed.startsWith('### ')) {
    const lines = trimmed.split('\n');
    const header = lines[0].replace('### ', '').trim();
    const rest = lines.slice(1).join('\n').trim();

    return (
      <section key={index} className="flex flex-col gap-1.5 text-left">
        <h3 className="text-sm font-semibold text-brand-accent">{header}</h3>
        {rest ? renderSectionBody(rest) : null}
      </section>
    );
  }

  return renderSectionBody(trimmed, index);
}

function renderSectionBody(text: string, key?: number): ReactNode {
  const lines = text.split('\n');
  const listItems: string[] = [];
  const paragraphs: ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      paragraphs.push(
        <ul
          key={`ul-${paragraphs.length}`}
          className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted"
        >
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineText(item)}</li>
          ))}
        </ul>,
      );
      listItems.length = 0;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('* ') || line.startsWith('- ')) {
      listItems.push(line.slice(2));
    } else if (line) {
      flushList();
      paragraphs.push(
        <p key={`p-${paragraphs.length}`} className="text-xs leading-relaxed text-muted">
          {renderInlineText(line)}
        </p>,
      );
    }
  }
  flushList();

  return (
    <div key={key} className="flex flex-col gap-2">
      {paragraphs}
    </div>
  );
}

export function TermLoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert tone="error" className="text-xs">
      <p>{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Tentar novamente
        </Button>
      ) : null}
    </Alert>
  );
}

export function TermsAndPrivacyContent({
  term,
  isLoading,
  error,
  onRetry,
  requireLiveTerm = false,
  onTermLoaded,
}: TermsAndPrivacyContentProps) {
  const isControlled = term !== undefined;
  const uncontrolled = useCurrentTerm({
    enabled: !isControlled,
    requireLiveTerm,
    onLoaded: onTermLoaded,
  });
  const activeTerm = isControlled ? term : uncontrolled.term;
  const activeLoading = isControlled ? Boolean(isLoading) : uncontrolled.isLoading;
  const activeError = isControlled ? (error ?? null) : uncontrolled.error;
  const activeRetry = isControlled ? onRetry : () => void uncontrolled.reload();

  if (activeError) {
    return <TermLoadError message={activeError} onRetry={activeRetry} />;
  }
  if (activeLoading && !activeTerm) {
    return <span className="text-xs text-brand-accent animate-pulse">Carregando termos...</span>;
  }
  if (!activeTerm) {
    return <TermLoadError message={LIVE_TERM_LOAD_ERROR} onRetry={activeRetry} />;
  }

  const blocks = activeTerm.texto.split(/\n\s*\n/);

  return (
    <div className="flex flex-col gap-4 text-left">
      {activeLoading && (
        <div className="flex justify-end border-b border-border-subtle pb-1">
          <span className="text-[10px] text-brand-accent animate-pulse">Atualizando termos...</span>
        </div>
      )}
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

export default TermsAndPrivacyContent;
