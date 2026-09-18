import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { HttpLoggerMiddleware } from './http-logger.middleware';

describe('HttpLoggerMiddleware', () => {
  let middleware: HttpLoggerMiddleware;
  let next: NextFunction;
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  const aRequest = (): Request =>
    ({ method: 'GET', originalUrl: '/api/alunos', ip: '127.0.0.1' }) as Request;

  const aResponse = (statusCode: number, contentLength?: string): Response => {
    const response = new EventEmitter() as unknown as Response;
    response.statusCode = statusCode;
    response.get = jest.fn().mockReturnValue(contentLength);
    return response;
  };

  const finish = (response: Response): void => {
    (response as unknown as EventEmitter).emit('finish');
  };

  beforeEach(() => {
    middleware = new HttpLoggerMiddleware();
    next = jest.fn();
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lets the request continue to the next handler', () => {
    middleware.use(aRequest(), aResponse(200), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('logs nothing while the response has not been sent', () => {
    middleware.use(aRequest(), aResponse(200), next);

    expect(log).not.toHaveBeenCalled();
  });

  it('logs method, url, status, duration, size and client once the response finishes', () => {
    const response = aResponse(200, '42');

    middleware.use(aRequest(), response, next);
    finish(response);

    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/api\/alunos 200 - \d+\.\d+ms - 42b - 127\.0\.0\.1$/),
    );
  });

  it('reports a response without content-length as an unknown size', () => {
    const response = aResponse(204);

    middleware.use(aRequest(), response, next);
    finish(response);

    expect(log).toHaveBeenCalledWith(expect.stringContaining('204 - '));
    expect(log).toHaveBeenCalledWith(expect.stringContaining(' - - - 127.0.0.1'));
  });

  it('warns when the client got an error back', () => {
    const response = aResponse(404);

    middleware.use(aRequest(), response, next);
    finish(response);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('GET /api/alunos 404'));
    expect(log).not.toHaveBeenCalled();
  });

  it('raises an error entry when the server failed', () => {
    const response = aResponse(500);

    middleware.use(aRequest(), response, next);
    finish(response);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('GET /api/alunos 500'));
    expect(log).not.toHaveBeenCalled();
  });
});
