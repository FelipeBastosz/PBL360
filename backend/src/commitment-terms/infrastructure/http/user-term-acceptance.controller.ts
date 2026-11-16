import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { AllowUnacceptedTerms } from '@/shared/decorators/allow-unaccepted-terms.decorator';
import { GetUserTermAcceptanceUseCase } from '../../application/use-cases/get-user-term-acceptance.use-case';
import { AcceptCommitmentTermUseCase } from '../../application/use-cases/accept-commitment-term.use-case';
import { AcceptTermDto } from '../../application/dtos/accept-term.dto';
import type { TermAcceptanceStatusResponseDto } from '../../application/dtos/term-acceptance-status-response.dto';
import {
  AcceptCommitmentTermSwaggerDocs,
  GetUserTermAcceptanceSwaggerDocs,
} from './user-term-acceptance.swagger';

@ApiTags('Usuários - Termo de Compromisso')
@Controller('usuarios/meu-aceite-termo')
@AllowUnacceptedTerms()
export class UserTermAcceptancesController {
  constructor(
    private readonly getAcceptance: GetUserTermAcceptanceUseCase,
    private readonly acceptTerm: AcceptCommitmentTermUseCase,
  ) {}

  @Get()
  @GetUserTermAcceptanceSwaggerDocs
  async getMyAcceptance(
    @AuthenticatedUserId() userId: string,
  ): Promise<TermAcceptanceStatusResponseDto> {
    return this.getAcceptance.execute(userId);
  }

  @Post()
  @AcceptCommitmentTermSwaggerDocs
  async accept(
    @AuthenticatedUserId() userId: string,
    @Body() dto: AcceptTermDto,
  ): Promise<TermAcceptanceStatusResponseDto> {
    return this.acceptTerm.execute({ userId, version: dto.versao });
  }
}
