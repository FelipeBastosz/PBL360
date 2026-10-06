import { IsUUID } from 'class-validator';

export class ChangeProblemPerformanceTableDto {
  @IsUUID('4', { message: 'A tabela de desempenho informada é inválida.' })
  tabelaId!: string;
}
