import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  COMMITMENT_TERM_REPOSITORY,
  type CommitmentTermRepository,
} from '../../domain/repositories/commitment-term.repository';
import {
  USER_TERM_ACCEPTANCE_REPOSITORY,
  type UserTermAcceptanceRepository,
} from '../../domain/repositories/user-term-acceptance.repository';

export interface UserTermAcceptanceStatus {
  aceito: boolean;
  versaoAceita: string | null;
  aceitoEm: Date | null;
  versaoVigente: string;
}

@Injectable()
export class GetUserTermAcceptanceUseCase {
  constructor(
    @Inject(COMMITMENT_TERM_REPOSITORY)
    private readonly commitmentTerms: CommitmentTermRepository,
    @Inject(USER_TERM_ACCEPTANCE_REPOSITORY)
    private readonly userTermAcceptances: UserTermAcceptanceRepository,
  ) {}

  async execute(userId: string): Promise<UserTermAcceptanceStatus> {
    const currentTerm = await this.commitmentTerms.findCurrent();
    if (!currentTerm) {
      throw new NotFoundError('Nenhum termo de compromisso vigente foi encontrado.');
    }

    const acceptance = await this.userTermAcceptances.findByUserId(userId);
    return {
      aceito: Boolean(acceptance),
      versaoAceita: acceptance?.termVersion ?? null,
      aceitoEm: acceptance?.acceptedAt ?? null,
      versaoVigente: currentTerm.version,
    };
  }
}
