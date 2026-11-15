import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { SaveSessionGeneralEvaluationDto } from '../../application/dtos/save-session-general-evaluation.dto';
import type { SessionGeneralEvaluationResponseDto } from '../../application/dtos/session-general-evaluation-response.dto';
import { GetSessionGeneralEvaluationUseCase } from '../../application/use-cases/get-session-general-evaluation.use-case';
import { SaveSessionGeneralEvaluationUseCase } from '../../application/use-cases/save-session-general-evaluation.use-case';
import {
  GetSessionGeneralEvaluationSwaggerDocs,
  SaveSessionGeneralEvaluationSwaggerDocs,
} from './session-general-evaluations.swagger';

@ApiTags('Avaliação geral da sessão')
@Controller('sessoes/:sessaoId/avaliacao-geral')
@Roles(UserType.TUTOR, UserType.STUDENT)
export class SessionGeneralEvaluationsController {
  constructor(
    private readonly getEvaluation: GetSessionGeneralEvaluationUseCase,
    private readonly saveEvaluation: SaveSessionGeneralEvaluationUseCase,
  ) {}

  @Get()
  @GetSessionGeneralEvaluationSwaggerDocs
  async get(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<SessionGeneralEvaluationResponseDto[]> {
    const records = await this.getEvaluation.execute(sessionId, member);
    return records.map((record) => this.toResponse(record));
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @SaveSessionGeneralEvaluationSwaggerDocs
  async save(
    @UuidParam('sessaoId') sessionId: string,
    @Body() dto: SaveSessionGeneralEvaluationDto,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<SessionGeneralEvaluationResponseDto> {
    const record = await this.saveEvaluation.execute(sessionId, dto.texto, member.id, member.type);
    return this.toResponse(record);
  }

  private toResponse(record: {
    id: string;
    text: string;
    author: { id: string; name: string };
    createdAt: Date;
    updatedAt: Date;
  }): SessionGeneralEvaluationResponseDto {
    return {
      id: record.id,
      texto: record.text,
      autor: { id: record.author.id, nome: record.author.name },
      criadoEm: record.createdAt,
      editadoEm: record.updatedAt,
    };
  }
}
