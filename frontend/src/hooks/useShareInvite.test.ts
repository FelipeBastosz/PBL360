import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoomInviteUrl } from '@/utils/urlBuilder';
import { useShareInvite } from './useShareInvite';

const notify = vi.fn();

vi.mock('./useToast', () => ({ useToast: () => ({ notify }) }));

const invite = { roomName: 'MI Programação - TP01', roomCode: 'aB7kP2x9' };

function setNavigator(share: ((data: ShareData) => Promise<void>) | undefined) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
}

describe('useShareInvite', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    setNavigator(undefined);
  });

  it('opens the native share sheet with the room code in the text', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator(share);
    const { result } = renderHook(() => useShareInvite());

    await result.current(invite);

    expect(share).toHaveBeenCalledWith({
      title: 'Convite para turma',
      text: 'Entre na turma MI Programação - TP01 no PBL360 com o código aB7kP2x9.',
      url: buildRoomInviteUrl('aB7kP2x9'),
    });
    expect(notify).not.toHaveBeenCalled();
  });

  it('stays quiet when the person closes the share sheet', async () => {
    setNavigator(vi.fn().mockRejectedValue(new DOMException('cancelado', 'AbortError')));
    const { result } = renderHook(() => useShareInvite());

    await result.current(invite);

    expect(notify).not.toHaveBeenCalled();
  });

  it('copies the link and confirms it where sharing is not supported', async () => {
    const { result } = renderHook(() => useShareInvite());

    await result.current(invite);

    expect(writeText).toHaveBeenCalledWith(buildRoomInviteUrl('aB7kP2x9'));
    expect(notify).toHaveBeenCalledWith({ tone: 'success', message: 'Link da turma copiado.' });
  });

  it('tells the person when the link could not be shared', async () => {
    writeText.mockRejectedValueOnce(new Error('sem permissão'));
    const { result } = renderHook(() => useShareInvite());

    await result.current(invite);

    expect(notify).toHaveBeenCalledWith({
      tone: 'error',
      message: 'Não foi possível compartilhar o link da turma.',
    });
  });
});
