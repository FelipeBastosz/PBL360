import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class SaveStudentProblemFeedbackDto {
  @ApiPropertyOptional({
    description: 'Nota atribuída ao aluno no problema (de 0 a 10), ou null.',
    example: 8.5,
    minimum: 0,
    maximum: 10,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber({}, { message: 'A nota deve ser um número válido.' })
  @Min(0, { message: 'A nota mínima permitida é 0.' })
  @Max(10, { message: 'A nota máxima permitida é 10.' })
  nota?: number | null;

  @ApiPropertyOptional({ example: 'ALUNO' })
  @IsOptional()
  @IsString()
  escopo?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsString()
  destinatario_id?: string | null;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsString()
  destinatarioId?: string | null;

  @ApiProperty({
    description: 'Texto do feedback direcionado ao aluno no problema (1 a 2000 caracteres).',
    example: 'Excelente participação durante a tutoria e fundamentação das fontes.',
    minLength: 1,
    maxLength: 2000,
  })
  @IsNotEmpty({ message: 'O texto do feedback é obrigatório.' })
  @IsString({ message: 'O texto do feedback deve ser uma cadeia de caracteres.' })
  @Length(1, 2000, { message: 'O texto do feedback deve ter entre 1 e 2000 caracteres.' })
  texto!: string;
}
