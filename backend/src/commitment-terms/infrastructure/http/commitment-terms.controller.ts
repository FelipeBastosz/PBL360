import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/shared/decorators/public.decorator';
import { GetCurrentCommitmentTermUseCase } from '../../application/use-cases/get-current-commitment-term.use-case';
import type { CommitmentTermResponseDto } from '../../application/dtos/commitment-term-response.dto';
import { GetCurrentCommitmentTermSwaggerDocs } from './commitment-terms.swagger';

@ApiTags('Termos de Compromisso')
@Controller('termos-compromisso')
export class CommitmentTermsController {
  constructor(private readonly getCurrentTerm: GetCurrentCommitmentTermUseCase) {}

  @Get('vigente')
  @Public()
  @GetCurrentCommitmentTermSwaggerDocs
  async getCurrent(): Promise<CommitmentTermResponseDto> {
    const term = await this.getCurrentTerm.execute();
    return {
      versao: term.version,
      titulo: term.title,
      texto: term.content,
    };
  }
}
