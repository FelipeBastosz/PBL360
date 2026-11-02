import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ReportExportQueryDto } from '@/report-files/application/dtos/report-export-query.dto';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true || value === 1 || value === '1') return true;
  if (
    value === 'false' ||
    value === false ||
    value === 0 ||
    value === '0' ||
    value === 'null' ||
    value === null
  ) {
    return false;
  }
  return value;
};

export class ExportProblemReportQueryDto extends ReportExportQueryDto {
  @ApiPropertyOptional({
    description: 'Se verdadeiro, oculta os nomes dos alunos e exibe apenas as matrículas.',
    default: false,
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'O campo ocultarNomes deve ser um booleano.' })
  ocultarNomes?: boolean;

  @ApiPropertyOptional({
    description: 'Se falso ou null, omite a seção de feedbacks do relatório.',
    default: true,
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'O campo mostrarFeedback deve ser um booleano.' })
  mostrarFeedback?: boolean;

  @ApiPropertyOptional({
    description:
      'Se falso ou null, omite a seção de marcações (tags de comportamento) das sessões.',
    default: true,
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'O campo mostrarMarcacoes deve ser um booleano.' })
  mostrarMarcacoes?: boolean;
}
