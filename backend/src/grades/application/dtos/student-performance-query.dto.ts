import { IsOptional, IsUUID } from 'class-validator';

export class StudentPerformanceQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'O problema informado deve ser um UUID válido.' })
  problemaId?: string;
}
