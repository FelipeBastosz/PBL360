import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const NANOSECONDS_PER_MILLISECOND = 1e6;
const SERVER_ERROR = 500;
const CLIENT_ERROR = 400;

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt: bigint = process.hrtime.bigint();

    response.once('finish', () => this.report(request, response, startedAt));

    next();
  }

  private report(request: Request, response: Response, startedAt: bigint): void {
    const message: string = this.buildMessage(request, response, startedAt);

    if (response.statusCode >= SERVER_ERROR) {
      this.logger.error(message);
      return;
    }

    if (response.statusCode >= CLIENT_ERROR) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }

  private buildMessage(request: Request, response: Response, startedAt: bigint): string {
    const elapsed: string = this.elapsedMilliseconds(startedAt);
    const size: string = this.responseSize(response);

    return `${request.method} ${request.originalUrl} ${response.statusCode} - ${elapsed}ms - ${size} - ${request.ip ?? '-'}`;
  }

  private elapsedMilliseconds(startedAt: bigint): string {
    const elapsed: number =
      Number(process.hrtime.bigint() - startedAt) / NANOSECONDS_PER_MILLISECOND;
    return elapsed.toFixed(1);
  }

  private responseSize(response: Response): string {
    const contentLength: string | undefined = response.get('content-length');
    return contentLength === undefined ? '-' : `${contentLength}b`;
  }
}
