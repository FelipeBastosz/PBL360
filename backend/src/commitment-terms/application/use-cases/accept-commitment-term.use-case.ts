import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '@/shared/errors/application.error';
import {
  COMMITMENT_TERM_REPOSITORY,
  type CommitmentTermRepository,
} from '../../domain/repositories/commitment-term.repository';
import {
  USER_TERM_ACCEPTANCE_REPOSITORY,
  type UserTermAcceptanceRepository,
} from '../../domain/repositories/user-term-acceptance.repository';
import { UserTermAcceptance } from '../../domain/entities/user-term-acceptance.entity';
import type { CommitmentTerm } from '../../domain/entities/commitment-term.entity';
import type { UserTermAcceptanceStatus } from './get-user-term-acceptance.use-case';

export interface AcceptCommitmentTermInput {
  userId: string;
  version: string;
}

@Injectable()
export class AcceptCommitmentTermUseCase {
  constructor(
    @Inject(COMMITMENT_TERM_REPOSITORY)
    private readonly commitmentTerms: CommitmentTermRepository,
    @Inject(USER_TERM_ACCEPTANCE_REPOSITORY)
    private readonly userTermAcceptances: UserTermAcceptanceRepository,
  ) {}

  async execute(input: AcceptCommitmentTermInput): Promise<UserTermAcceptanceStatus> {
    const currentTerm = await this.commitmentTerms.findCurrent();
    if (!currentTerm) {
      throw new NotFoundError('Nenhum termo de compromisso vigente foi encontrado.');
    }

    this.assertValidVersion(input.version, currentTerm.version);

    const existing = await this.userTermAcceptances.findByUserId(input.userId);
    if (existing && existing.termVersion === currentTerm.version) {
      return this.toStatus(existing, currentTerm.version);
    }

    const saved = await this.recordAcceptance(input.userId, currentTerm);
    return this.toStatus(saved, currentTerm.version);
  }

  private assertValidVersion(inputVersion: string, currentVersion: string): void {
    if (inputVersion.trim() !== currentVersion) {
      throw new ConflictError(
        'A versão do termo enviada não corresponde à versão vigente do termo de compromisso.',
      );
    }
  }

  private async recordAcceptance(
    userId: string,
    currentTerm: CommitmentTerm,
  ): Promise<UserTermAcceptance> {
    const acceptance = UserTermAcceptance.create({
      userId,
      termId: currentTerm.id,
      termVersion: currentTerm.version,
    });
    return this.userTermAcceptances.create(acceptance);
  }

  private toStatus(
    acceptance: UserTermAcceptance,
    versaoVigente: string,
  ): UserTermAcceptanceStatus {
    return {
      aceito: acceptance.termVersion === versaoVigente,
      versaoAceita: acceptance.termVersion,
      aceitoEm: acceptance.acceptedAt,
      versaoVigente,
    };
  }
}
