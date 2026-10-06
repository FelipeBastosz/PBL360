import { useCallback } from 'react';
import { buildRoomInviteUrl } from '@/utils/urlBuilder';
import { useToast } from './useToast';

type InviteTarget = {
  roomName: string;
  roomCode: string;
};

const isShareCancel = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

export function useShareInvite() {
  const { notify } = useToast();

  return useCallback(
    async ({ roomName, roomCode }: InviteTarget) => {
      const url = buildRoomInviteUrl(roomCode);
      const text = `Entre na turma ${roomName} no PBL360 com o código ${roomCode}.`;

      try {
        if (navigator.share) {
          await navigator.share({ title: 'Convite para turma', text, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        notify({ tone: 'success', message: 'Link da turma copiado.' });
      } catch (error) {
        if (!isShareCancel(error)) {
          notify({ tone: 'error', message: 'Não foi possível compartilhar o link da turma.' });
        }
      }
    },
    [notify],
  );
}
