import { useEffect, useRef, useState } from 'react';
import { connectPokerSocket, POKER_EVENTS, type PokerEventName } from '@/services/pokerSocket';
import type { PokerConnection } from '@/types/planningPoker';

export type PokerChannelHandlers = {
  onEvent: (name: PokerEventName, payload: unknown) => void;
  onResync: () => void;
};

export function usePokerChannel(
  sessionId: string,
  enabled: boolean,
  handlers: PokerChannelHandlers,
): PokerConnection {
  const [connection, setConnection] = useState<PokerConnection>('live');
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled || !sessionId) return undefined;
    const socket = connectPokerSocket(sessionId);
    socket.on('poker.conectado', () => {
      setConnection('live');
      handlersRef.current.onResync();
    });
    socket.on('disconnect', () => setConnection('reconnecting'));
    socket.on('connect_error', () => setConnection('reconnecting'));
    socket.on('poker.erro', () => setConnection('error'));
    POKER_EVENTS.forEach((name) =>
      socket.on(name, (payload: unknown) => handlersRef.current.onEvent(name, payload)),
    );
    return () => {
      socket.disconnect();
    };
  }, [sessionId, enabled]);

  return connection;
}
