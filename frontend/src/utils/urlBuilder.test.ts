import { describe, test, expect, vi } from 'vitest';
import { buildRoomInviteUrl } from './urlBuilder';

describe('buildRoomInviteUrl', () => {
  test('constrói a URL correta a partir do código da sala', () => {
    expect(buildRoomInviteUrl('aB7kP2x9')).toBe('https://pbl360.com/salas/aB7kP2x9');
  });

  test('escapa caracteres especiais no código', () => {
    expect(buildRoomInviteUrl('code with spaces')).toBe(
      'https://pbl360.com/salas/code%20with%20spaces',
    );
  });

  test('remove barra final da base, se houver', async () => {
    // Mocka a constante de configuração usando caminho relativo
    vi.doMock('../config/appUrl', () => ({
      APP_URL: 'https://pbl360.com/',
    }));
    const { buildRoomInviteUrl: buildWithSlash } = await import('./urlBuilder');

    expect(buildWithSlash('XYZ123')).toBe('https://pbl360.com/salas/XYZ123');
  });
});
