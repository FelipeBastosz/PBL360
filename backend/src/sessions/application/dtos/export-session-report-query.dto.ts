import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ReportExportQueryDto } from '@/report-files/application/dtos/report-export-query.dto';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true || value === 1 || value === '1') return true;
  if (value === 'false' || value === false || value === 0 || value === '0') return false;
  return value;
};

export class ExportSessionReportQueryDto extends ReportExportQueryDto {
  @ApiPropertyOptional({
    description: 'Se verdadeiro, oculta os nomes dos alunos e exibe apenas as matrículas.',
    default: false,
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'O campo ocultarNome deve ser um booleano.' })
  ocultarNome?: boolean;

  @ApiPropertyOptional({
    description: 'Se falso, não inclui a seção de feedbacks no relatório.',
    default: true,
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'O campo mostrarFeedBack deve ser um booleano.' })
  mostrarFeedBack?: boolean;

  @ApiPropertyOptional({
    description: 'Se falso, não inclui a seção de marcações no relatório.',
    default: false,
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'O campo mostrarMarcacoes deve ser um booleano.' })
  mostrarMarcacoes?: boolean;
}
