import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { RecordRollCallDto, RollCallResponseDto } from '../../application/dtos/roll-call.dto';
import { GetRollCallUseCase } from '../../application/use-cases/get-roll-call.use-case';
import { RecordRollCallUseCase } from '../../application/use-cases/record-roll-call.use-case';
import { toAttendanceEntries, toRollCallResponse } from './roll-call.mapper';
import { GetRollCallSwaggerDocs, RecordRollCallSwaggerDocs } from './roll-call.swagger';

@ApiTags('Chamada da sessão')
@Controller('sessoes')
@Roles(UserType.TUTOR)
export class RollCallController {
  constructor(
    private readonly getRollCall: GetRollCallUseCase,
    private readonly recordRollCall: RecordRollCallUseCase,
  ) {}

  @Get(':sessaoId/chamada')
  @GetRollCallSwaggerDocs
  async get(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<RollCallResponseDto> {
    return toRollCallResponse(await this.getRollCall.execute(sessionId, tutorId));
  }

  @Put(':sessaoId/chamada')
  @HttpCode(HttpStatus.OK)
  @RecordRollCallSwaggerDocs
  async record(
    @UuidParam('sessaoId') sessionId: string,
    @Body() dto: RecordRollCallDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<RollCallResponseDto> {
    const rollCall = await this.recordRollCall.execute({
      sessionId,
      tutorId,
      entries: toAttendanceEntries(dto),
    });
    return toRollCallResponse(rollCall);
  }
}
