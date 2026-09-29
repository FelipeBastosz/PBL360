import { APP_URL } from '../config/appUrl';

export const buildRoomInviteUrl = (codigoSala: string): string => {
  const base = APP_URL.replace(/\/+$/, '');
  const path = '/salas';
  return `${base}${path}/${encodeURIComponent(codigoSala)}`;
};
