import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { ReportFileFormat } from '../../domain/report-document';
import { INVALID_REPORT_FORMAT_MESSAGE } from '../services/report-file.service';

const toUpperCase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class ReportExportQueryDto {
  @ApiProperty({ enum: ReportFileFormat, example: ReportFileFormat.PDF })
  @Transform(toUpperCase)
  @IsEnum(ReportFileFormat, { message: INVALID_REPORT_FORMAT_MESSAGE })
  formato!: ReportFileFormat;
}
