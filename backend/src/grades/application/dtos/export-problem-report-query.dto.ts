import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ReportExportQueryDto } from '@/report-files/application/dtos/report-export-query.dto';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true || value === 1 || value === '1') return true;
  if (value === 'false' || value === false || value === 0 || value === '0') return false;
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
}
