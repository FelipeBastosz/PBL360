import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import type { Server } from 'socket.io';
import { CorsIoAdapter } from './cors-io.adapter';

describe('CorsIoAdapter', () => {
  it('passes configured origins to the Socket.IO server while preserving other options', () => {
    const server = {} as Server;
    const createServer = jest.spyOn(IoAdapter.prototype, 'createIOServer').mockReturnValue(server);
    const origins = ['https://pbl360.example.test'];
    const adapter = new CorsIoAdapter({} as INestApplicationContext, origins);
    const options = { pingTimeout: 12_000, cors: { origin: '*' } };

    expect(adapter.createIOServer(8080, options)).toBe(server);
    expect(createServer).toHaveBeenCalledWith(8080, { ...options, cors: { origin: origins } });
    createServer.mockRestore();
  });
});
