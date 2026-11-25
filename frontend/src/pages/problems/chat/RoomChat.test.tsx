import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { conversationService } from '@/services/conversation.service';
import { roomService } from '@/services/room.service';
import type { ChatMessage, Conversation } from '@/types/conversation';
import type { RoomStudent, RoomTutor } from '@/types/room';
import { RoomChat } from './RoomChat';

vi.mock('@/services/conversation.service', () => ({
  conversationService: {
    listForRoom: vi.fn(),
    open: vi.fn(),
    listMessages: vi.fn(),
    send: vi.fn(),
  },
}));

vi.mock('@/services/room.service', () => ({
  roomService: { listStudents: vi.fn(), listTutors: vi.fn() },
}));

const student = (id: string, nome: string): RoomStudent => ({
  id,
  nome,
  email: `${id}@test.com`,
  matricula: '2026001',
  dataEntrada: '2026-08-01',
});

const anaConversation: Conversation = {
  id: 'conv-ana',
  interlocutor: { id: 'ana', nome: 'Ana Souza', tipo: 'ALUNO', possuiFoto: false },
  ultimaMensagem: { texto: 'Posso entregar em PDF?', enviadaEm: '2026-11-16T10:00:00.000Z' },
};

const anaMessage: ChatMessage = {
  id: 'msg-1',
  remetente: { id: 'ana', nome: 'Ana Souza' },
  texto: 'Posso entregar em PDF?',
  enviadaEm: '2026-11-16T10:00:00.000Z',
};

const tutors: RoomTutor[] = [
  { id: 'tutor-1', nome: 'Marina Alves', email: 'marina@test.com', responsavel: true },
  { id: 'tutor-2', nome: 'Ricardo Lopes', email: 'ricardo@test.com', responsavel: false },
];

function renderChat(isProfessor = true) {
  const currentUserId = isProfessor ? 'tutor-1' : 'ana';
  return render(
    <RoomChat roomId="room-1" isProfessor={isProfessor} currentUserId={currentUserId} />,
  );
}

async function openChat() {
  await userEvent.click(await screen.findByRole('button', { name: /abrir conversas/i }));
  return screen.findByRole('dialog', { name: 'Conversas' });
}

describe('RoomChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(conversationService.listForRoom).mockResolvedValue([anaConversation]);
    vi.mocked(conversationService.listMessages).mockResolvedValue({
      itens: [anaMessage],
      proximoCursor: null,
    });
    vi.mocked(roomService.listStudents).mockResolvedValue([
      student('ana', 'Ana Souza'),
      student('bruno', 'Bruno Carvalho'),
    ]);
    vi.mocked(roomService.listTutors).mockResolvedValue(tutors);
  });

  it('flags the chat button while a conversation has a message not seen yet', async () => {
    renderChat();

    expect(
      await screen.findByRole('button', { name: 'Abrir conversas, há mensagens novas' }),
    ).toBeInTheDocument();
  });

  it('lets the tutor pick among the students, recent conversations first', async () => {
    renderChat();
    const dialog = await openChat();

    const recent = await within(dialog).findByRole('region', { name: 'Recentes' });
    expect(within(recent).getByText('Ana Souza')).toBeInTheDocument();
    const everyone = within(dialog).getByRole('region', { name: 'Todos os alunos' });
    expect(within(everyone).getByText('Bruno Carvalho')).toBeInTheDocument();
    expect(roomService.listTutors).not.toHaveBeenCalled();
  });

  it('shows the messages of the chosen student and clears the new message flag', async () => {
    renderChat();
    const dialog = await openChat();

    await userEvent.click(await within(dialog).findByRole('button', { name: /ana souza/i }));

    expect(
      await within(dialog).findByRole('list', { name: 'Mensagens com Ana Souza' }),
    ).toHaveTextContent('Posso entregar em PDF?');
    expect(conversationService.listMessages).toHaveBeenCalledWith('conv-ana');
    expect(screen.getByRole('button', { name: 'Abrir conversas' })).toBeInTheDocument();
  });

  it('sends a message in an existing conversation', async () => {
    vi.mocked(conversationService.send).mockResolvedValue({
      ...anaMessage,
      id: 'msg-2',
      remetente: { id: 'tutor-1', nome: 'Marina Alves' },
      texto: 'Pode sim.',
    });
    renderChat();
    const dialog = await openChat();
    await userEvent.click(await within(dialog).findByRole('button', { name: /ana souza/i }));

    await userEvent.type(
      await within(dialog).findByLabelText('Mensagem para Ana Souza'),
      'Pode sim.{Enter}',
    );

    expect(conversationService.send).toHaveBeenCalledWith('conv-ana', { texto: 'Pode sim.' });
    expect(await within(dialog).findByText('Pode sim.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Mensagem para Ana Souza')).toHaveValue('');
  });

  it('creates the conversation only when the first message is sent', async () => {
    vi.mocked(conversationService.open).mockResolvedValue({
      id: 'conv-bruno',
      interlocutor: { id: 'bruno', nome: 'Bruno Carvalho', tipo: 'ALUNO', possuiFoto: false },
    });
    vi.mocked(conversationService.send).mockResolvedValue({
      id: 'msg-3',
      remetente: { id: 'tutor-1', nome: 'Marina Alves' },
      texto: 'Oi, Bruno!',
      enviadaEm: '2026-11-16T11:00:00.000Z',
    });
    renderChat();
    const dialog = await openChat();
    await userEvent.click(await within(dialog).findByRole('button', { name: /bruno carvalho/i }));

    expect(await within(dialog).findByText(/nenhuma mensagem ainda/i)).toBeInTheDocument();
    expect(conversationService.open).not.toHaveBeenCalled();

    await userEvent.type(
      within(dialog).getByLabelText('Mensagem para Bruno Carvalho'),
      'Oi, Bruno!',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar mensagem' }));

    expect(conversationService.open).toHaveBeenCalledWith('room-1', { destinatarioId: 'bruno' });
    expect(conversationService.send).toHaveBeenCalledWith('conv-bruno', { texto: 'Oi, Bruno!' });
  });

  it('keeps the typed message and explains why it could not be sent', async () => {
    vi.mocked(conversationService.send).mockRejectedValue(
      new ApiError(403, ['Você não possui mais vínculo de professor nesta sala.']),
    );
    renderChat();
    const dialog = await openChat();
    await userEvent.click(await within(dialog).findByRole('button', { name: /ana souza/i }));

    await userEvent.type(
      await within(dialog).findByLabelText('Mensagem para Ana Souza'),
      'Olá{Enter}',
    );

    expect(
      await within(dialog).findByText('Você não possui mais vínculo de professor nesta sala.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Mensagem para Ana Souza')).toHaveValue('Olá');
  });

  it('loads each older page once while the tutor scrolls up the history', async () => {
    vi.mocked(conversationService.listMessages)
      .mockResolvedValueOnce({ itens: [anaMessage], proximoCursor: 'msg-1' })
      .mockResolvedValueOnce({
        itens: [{ ...anaMessage, id: 'msg-0', texto: 'Bom dia, professora.' }],
        proximoCursor: null,
      });
    renderChat();
    const dialog = await openChat();
    await userEvent.click(await within(dialog).findByRole('button', { name: /ana souza/i }));
    const list = await within(dialog).findByRole('list', { name: 'Mensagens com Ana Souza' });
    const container = list.parentElement!;
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 300 });

    container.scrollTop = 0;
    fireEvent.scroll(container);
    fireEvent.scroll(container);

    expect(await within(dialog).findByText('Bom dia, professora.')).toBeInTheDocument();
    expect(conversationService.listMessages).toHaveBeenCalledTimes(2);
    expect(conversationService.listMessages).toHaveBeenLastCalledWith('conv-ana', {
      cursor: 'msg-1',
    });
  });

  it('lists only the tutors of the room for a student', async () => {
    vi.mocked(conversationService.listForRoom).mockResolvedValue([]);
    renderChat(false);
    const dialog = await openChat();

    const tutorsSection = await within(dialog).findByRole('region', {
      name: 'Professores da turma',
    });
    expect(within(tutorsSection).getByText('Marina Alves')).toBeInTheDocument();
    expect(within(tutorsSection).getByText('Professor responsável')).toBeInTheDocument();
    expect(within(tutorsSection).getByText('Professor colaborador')).toBeInTheDocument();
    expect(roomService.listStudents).not.toHaveBeenCalled();
  });

  it('shows the error when the participants cannot be loaded', async () => {
    vi.mocked(roomService.listStudents).mockRejectedValue(
      new ApiError(403, ['Você não faz parte desta turma.']),
    );
    renderChat();
    const dialog = await openChat();

    expect(await within(dialog).findByText('Você não faz parte desta turma.')).toBeInTheDocument();
  });

  it('closes the panel', async () => {
    renderChat();
    const dialog = await openChat();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar conversas' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
