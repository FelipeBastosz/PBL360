import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '@/types/conversation';
import { ChatMessageList } from './ChatMessageList';

const message = (id: string, senderId = 'ana'): ChatMessage => ({
  id,
  remetente: { id: senderId, nome: senderId === 'ana' ? 'Ana Souza' : 'Marina Alves' },
  texto: `Mensagem ${id}`,
  enviadaEm: '2026-11-21T10:00:00.000Z',
});

const baseProps = {
  currentUserId: 'tutor-1',
  recipientName: 'Ana Souza',
  isLoading: false,
  error: null,
};

type Metrics = { scrollHeight: number; clientHeight: number; scrollTop: number };

// jsdom has no layout, so the scroll container reports the sizes each test sets.
function stubScrollContainer(metrics: Metrics) {
  const container = screen.getByRole('list').parentElement!;
  for (const key of Object.keys(metrics) as (keyof Metrics)[]) {
    Object.defineProperty(container, key, {
      configurable: true,
      get: () => metrics[key],
      set: (value: number) => {
        metrics[key] = value;
      },
    });
  }
  return container;
}

type ListOptions = { hasOlder?: boolean; isLoadingOlder?: boolean };

function renderList(messages: ChatMessage[], options: ListOptions = {}) {
  const onLoadOlder = vi.fn();
  const props = { ...baseProps, hasOlder: false, isLoadingOlder: false, ...options, onLoadOlder };
  const view = render(<ChatMessageList {...props} messages={messages} />);
  const rerenderWith = (next: ChatMessage[], nextOptions: ListOptions = {}) =>
    view.rerender(<ChatMessageList {...props} {...nextOptions} messages={next} />);
  return { rerenderWith, onLoadOlder };
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe('ChatMessageList scrolling', () => {
  it('keeps the reading position when older messages are loaded at the top', () => {
    const { rerenderWith } = renderList([message('3'), message('4')], { hasOlder: true });
    const metrics = { scrollHeight: 1000, clientHeight: 300, scrollTop: 0 };
    fireEvent.scroll(stubScrollContainer(metrics));

    metrics.scrollHeight = 1600;
    rerenderWith([message('1'), message('2'), message('3'), message('4')]);

    expect(metrics.scrollTop).toBe(600);
  });

  it('never moves the list for a received message and flags it below, even at the end', async () => {
    const { rerenderWith } = renderList([message('1')]);
    const metrics = { scrollHeight: 1000, clientHeight: 300, scrollTop: 700 };
    fireEvent.scroll(stubScrollContainer(metrics));

    metrics.scrollHeight = 1200;
    rerenderWith([message('1'), message('2')]);

    expect(metrics.scrollTop).toBe(700);
    expect(await screen.findByRole('button', { name: 'Novas mensagens' })).toBeInTheDocument();
  });

  it('jumps to the new message from the shortcut and then hides it', async () => {
    const { rerenderWith } = renderList([message('1')]);
    const metrics = { scrollHeight: 1000, clientHeight: 300, scrollTop: 100 };
    fireEvent.scroll(stubScrollContainer(metrics));

    metrics.scrollHeight = 1200;
    rerenderWith([message('1'), message('2')]);

    expect(metrics.scrollTop).toBe(100);
    await userEvent.click(await screen.findByRole('button', { name: 'Novas mensagens' }));
    expect(metrics.scrollTop).toBe(1200);
    expect(screen.queryByRole('button', { name: 'Novas mensagens' })).not.toBeInTheDocument();
  });

  it('hides the shortcut once the reader scrolls down to the end', async () => {
    const { rerenderWith } = renderList([message('1')]);
    const metrics = { scrollHeight: 1000, clientHeight: 300, scrollTop: 100 };
    const container = stubScrollContainer(metrics);
    fireEvent.scroll(container);
    metrics.scrollHeight = 1200;
    rerenderWith([message('1'), message('2')]);
    await screen.findByRole('button', { name: 'Novas mensagens' });

    metrics.scrollTop = 900;
    fireEvent.scroll(container);

    expect(screen.queryByRole('button', { name: 'Novas mensagens' })).not.toBeInTheDocument();
  });

  it('does not flag a received message that is already in sight', async () => {
    const { rerenderWith } = renderList([message('1')]);
    const metrics = { scrollHeight: 1000, clientHeight: 300, scrollTop: 700 };
    fireEvent.scroll(stubScrollContainer(metrics));

    metrics.scrollHeight = 1040;
    rerenderWith([message('1'), message('2')]);
    await nextFrame();

    expect(screen.queryByRole('button', { name: 'Novas mensagens' })).not.toBeInTheDocument();
  });

  it('goes to the end after the user sends a message', async () => {
    const { rerenderWith } = renderList([message('1')]);
    const metrics = { scrollHeight: 1000, clientHeight: 300, scrollTop: 100 };
    fireEvent.scroll(stubScrollContainer(metrics));

    metrics.scrollHeight = 1200;
    rerenderWith([message('1'), message('2', 'tutor-1')]);
    await nextFrame();

    expect(metrics.scrollTop).toBe(1200);
    expect(screen.queryByRole('button', { name: 'Novas mensagens' })).not.toBeInTheDocument();
  });
});

describe('ChatMessageList history loading', () => {
  it('loads the previous page as the reader scrolls near the top', () => {
    const { onLoadOlder } = renderList([message('3'), message('4')], { hasOlder: true });
    const metrics = { scrollHeight: 1000, clientHeight: 300, scrollTop: 400 };
    const container = stubScrollContainer(metrics);
    fireEvent.scroll(container);
    expect(onLoadOlder).not.toHaveBeenCalled();

    metrics.scrollTop = 60;
    fireEvent.scroll(container);

    expect(onLoadOlder).toHaveBeenCalledOnce();
  });

  it('does not ask again while a page is loading and shows that it is loading', () => {
    const { onLoadOlder } = renderList([message('3')], { hasOlder: true, isLoadingOlder: true });
    fireEvent.scroll(stubScrollContainer({ scrollHeight: 1000, clientHeight: 300, scrollTop: 0 }));

    expect(onLoadOlder).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando mensagens anteriores');
  });

  it('stops at the beginning of the conversation', () => {
    const { onLoadOlder } = renderList([message('1')]);
    fireEvent.scroll(stubScrollContainer({ scrollHeight: 1000, clientHeight: 300, scrollTop: 0 }));

    expect(onLoadOlder).not.toHaveBeenCalled();
  });

  it('asks for more on its own when the first page does not fill the view', async () => {
    const { onLoadOlder } = renderList([message('3')], { hasOlder: true });
    stubScrollContainer({ scrollHeight: 200, clientHeight: 300, scrollTop: 0 });

    await nextFrame();

    expect(onLoadOlder).toHaveBeenCalledOnce();
  });
});
