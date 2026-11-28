import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/routes/paths';
import { toApiError } from '@/services/apiError';
import { roomService } from '@/services/room.service';
import { toJoinRoomRequest } from '@/utils/joinRoomForm';

type JoinByLinkState = {
  code: string;
  errorMessage: string | null;
};

function getPreconditionError(code: string, userType?: string): string | null {
  if (userType && userType !== 'ALUNO') {
    return 'Apenas alunos podem entrar em uma turma por link de convite.';
  }
  const request = toJoinRoomRequest(code);
  if (!request || request.kind !== 'code') {
    return 'O link de convite informado é inválido.';
  }
  return null;
}

export function useJoinRoomByLink(rawCode: string | undefined) {
  const code = rawCode?.trim() ?? '';
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const attemptedCode = useRef<string | null>(null);
  const [state, setState] = useState<JoinByLinkState>({ code, errorMessage: null });

  const preconditionError = getPreconditionError(code, user?.tipo);

  useEffect(() => {
    if (preconditionError || attemptedCode.current === code) return;
    attemptedCode.current = code;

    roomService
      .joinByCode({ codigoSala: code })
      .then(() => {
        notify({ tone: 'success', message: 'Pronto! Você entrou na turma.' });
        navigate(ROUTES.rooms, { replace: true });
      })
      .catch((caught: unknown) => {
        setState({ code, errorMessage: toApiError(caught).message });
      });
  }, [code, preconditionError, notify, navigate]);

  const errorMessage = preconditionError ?? (state.code === code ? state.errorMessage : null);

  return {
    isLoading: !errorMessage,
    errorMessage,
  };
}
