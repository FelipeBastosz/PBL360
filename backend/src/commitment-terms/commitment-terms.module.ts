import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommitmentTerm } from './domain/entities/commitment-term.entity';
import { UserTermAcceptance } from './domain/entities/user-term-acceptance.entity';
import { COMMITMENT_TERM_REPOSITORY } from './domain/repositories/commitment-term.repository';
import { USER_TERM_ACCEPTANCE_REPOSITORY } from './domain/repositories/user-term-acceptance.repository';
import { PgCommitmentTermRepository } from './infrastructure/database/pg-commitment-term.repository';
import { PgUserTermAcceptanceRepository } from './infrastructure/database/pg-user-term-acceptance.repository';
import { GetCurrentCommitmentTermUseCase } from './application/use-cases/get-current-commitment-term.use-case';
import { GetUserTermAcceptanceUseCase } from './application/use-cases/get-user-term-acceptance.use-case';
import { AcceptCommitmentTermUseCase } from './application/use-cases/accept-commitment-term.use-case';
import { CommitmentTermsController } from './infrastructure/http/commitment-terms.controller';
import { UserTermAcceptancesController } from './infrastructure/http/user-term-acceptance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommitmentTerm, UserTermAcceptance])],
  controllers: [CommitmentTermsController, UserTermAcceptancesController],
  providers: [
    GetCurrentCommitmentTermUseCase,
    GetUserTermAcceptanceUseCase,
    AcceptCommitmentTermUseCase,
    { provide: COMMITMENT_TERM_REPOSITORY, useClass: PgCommitmentTermRepository },
    { provide: USER_TERM_ACCEPTANCE_REPOSITORY, useClass: PgUserTermAcceptanceRepository },
  ],
  exports: [USER_TERM_ACCEPTANCE_REPOSITORY, COMMITMENT_TERM_REPOSITORY],
})
export class CommitmentTermsModule {}
