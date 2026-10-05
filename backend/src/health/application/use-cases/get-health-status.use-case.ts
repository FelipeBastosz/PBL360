import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthStatusResult {
  status: string;
  banco: string;
  versao: string;
}

const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

@Injectable()
export class GetHealthStatusUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<HealthStatusResult> {
    try {
      await this.dataSource.query('SELECT 1;');
      return {
        status: 'ok',
        banco: 'ok',
        versao: APP_VERSION,
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'erro',
        banco: 'indisponivel',
        versao: APP_VERSION,
      });
    }
  }
}
