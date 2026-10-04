import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/shared/decorators/public.decorator';
import { HealthCheckResponseDto } from '../../application/dtos/health-response.dto';
import { GetHealthStatusUseCase } from '../../application/use-cases/get-health-status.use-case';
import { HealthSwaggerDocs } from './health.swagger';

@ApiTags('Saúde')
@Controller('saude')
export class HealthController {
  constructor(private readonly getHealthStatus: GetHealthStatusUseCase) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @HealthSwaggerDocs
  check(): Promise<HealthCheckResponseDto> {
    return this.getHealthStatus.execute();
  }
}
