import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  COMMITMENT_TERM_REPOSITORY,
  type CommitmentTermRepository,
} from '../../domain/repositories/commitment-term.repository';
import type { CommitmentTerm } from '../../domain/entities/commitment-term.entity';

@Injectable()
export class GetCurrentCommitmentTermUseCase {
  constructor(
    @Inject(COMMITMENT_TERM_REPOSITORY)
    private readonly commitmentTerms: CommitmentTermRepository,
  ) {}

  async execute(): Promise<CommitmentTerm> {
    const current = await this.commitmentTerms.findCurrent();
    if (!current) {
      throw new NotFoundError('Nenhum termo de compromisso vigente foi encontrado.');
    }
    return current;
  }
}
