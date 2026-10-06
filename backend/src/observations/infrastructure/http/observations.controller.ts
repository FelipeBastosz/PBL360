import { Body, Controller, Delete, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { ComplementObservationDto } from '../../application/dtos/complement-observation.dto';
import type { ObservationResponseDto } from '../../application/dtos/observation-response.dto';
import { ComplementObservationUseCase } from '../../application/use-cases/complement-observation.use-case';
import { UndoObservationUseCase } from '../../application/use-cases/undo-observation.use-case';
import { toObservationResponse } from './observation.mapper';
import {
  ComplementObservationSwaggerDocs,
  UndoObservationSwaggerDocs,
} from './observation.swagger';

@ApiTags('Observações')
@Controller('observacoes')
@Roles(UserType.TUTOR)
export class ObservationsController {
  constructor(
    private readonly complementObservation: ComplementObservationUseCase,
    private readonly undoObservation: UndoObservationUseCase,
  ) {}

  @Patch(':id')
  @ComplementObservationSwaggerDocs
  async complement(
    @UuidParam('id') id: string,
    @Body() dto: ComplementObservationDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<ObservationResponseDto> {
    return toObservationResponse(
      await this.complementObservation.execute({ id, tutorId, text: dto.texto }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UndoObservationSwaggerDocs
  undo(@UuidParam('id') id: string, @AuthenticatedUserId() tutorId: string): Promise<void> {
    return this.undoObservation.execute({ id, tutorId });
  }
}
