import { ApiProperty } from '@nestjs/swagger';

export class SessionGeneralEvaluationAuthorDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Carlos Professor' })
  nome: string;
}

export class SessionGeneralEvaluationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ maxLength: 2000 })
  texto: string;

  @ApiProperty({ type: SessionGeneralEvaluationAuthorDto })
  autor: SessionGeneralEvaluationAuthorDto;

  @ApiProperty({ format: 'date-time' })
  criadoEm: Date;

  @ApiProperty({ format: 'date-time' })
  editadoEm: Date;
}
