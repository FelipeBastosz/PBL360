import { Module } from '@nestjs/common';
import { GetHealthStatusUseCase } from './application/use-cases/get-health-status.use-case';
import { HealthController } from './infrastructure/http/health.controller';

@Module({
  controllers: [HealthController],
  providers: [GetHealthStatusUseCase],
  exports: [GetHealthStatusUseCase],
})
export class HealthModule {}
