import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { EvaluationItemDto } from './evaluation-item.dto';

export class SavePeerEvaluationDto {
  @ApiProperty({
    type: EvaluationItemDto,
    isArray: true,
    description: 'Lista de notas por critério. Ao enviar, precisa conter todos os critérios.',
  })
  @IsArray({ message: 'Os itens da avaliação devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => EvaluationItemDto)
  itens!: EvaluationItemDto[];

  @ApiProperty({
    example: false,
    description: 'False salva o rascunho; true envia a avaliação definitivamente.',
  })
  @IsBoolean({ message: 'O campo enviar deve ser um booleano.' })
  enviar!: boolean;
}
