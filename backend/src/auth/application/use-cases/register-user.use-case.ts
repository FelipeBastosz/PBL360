import { Inject, Injectable } from '@nestjs/common';
import {
  ConflictError,
  InvalidRequestError,
  NotFoundError,
} from '@/shared/errors/application.error';
import {
  COMMITMENT_TERM_REPOSITORY,
  type CommitmentTermRepository,
} from '@/commitment-terms/domain/repositories/commitment-term.repository';
import type { CommitmentTerm } from '@/commitment-terms/domain/entities/commitment-term.entity';
import { User } from '@/users/domain/entities/user.entity';
import { UserPhoto } from '@/users/domain/entities/user-photo.entity';
import type { UserType } from '@/users/domain/enums/user-type.enum';
import { USER_REPOSITORY, type UserRepository } from '@/users/domain/repositories/user.repository';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/services/password-hasher';
import { EmailVerificationCodes } from '../services/email-verification-codes';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  type: UserType;
  acceptedTermVersion: string;
  acceptsTerms: boolean;
  registrationNumber?: string | null;
  photo?: Buffer | null;
}

type NewUserInput = Omit<RegisterUserInput, 'acceptedTermVersion' | 'acceptsTerms'>;

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    private readonly verificationCodes: EmailVerificationCodes,
    @Inject(COMMITMENT_TERM_REPOSITORY)
    private readonly commitmentTerms: CommitmentTermRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const { acceptedTermVersion, acceptsTerms, ...userInput } = input;
    this.assertExplicitAcceptance(acceptsTerms);
    const email = userInput.email.trim().toLowerCase();
    await this.assertEmailAvailable(email);
    const currentTerm = await this.getAcceptedTerm(acceptedTermVersion);
    const user = await this.createUser(userInput, email);
    const saved = await this.users.saveWithTermAcceptance(
      user,
      currentTerm.id,
      currentTerm.version,
    );

    await this.verificationCodes.issueFor(saved);

    return saved;
  }

  private assertExplicitAcceptance(accepted: boolean): void {
    if (!accepted) {
      throw new InvalidRequestError('É necessário aceitar os termos para concluir o cadastro.');
    }
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictError('Já existe uma conta cadastrada com este e-mail.');
    }
  }

  private async createUser(input: NewUserInput, email: string): Promise<User> {
    const photo = input.photo ? UserPhoto.fromBytes(input.photo) : null;
    const passwordHash = await this.passwords.hash(input.password);
    return User.create({ ...input, email, photo, passwordHash });
  }

  private async getAcceptedTerm(version: string): Promise<CommitmentTerm> {
    const currentTerm = await this.commitmentTerms.findCurrent();
    if (!currentTerm) {
      throw new NotFoundError('Nenhum termo de compromisso vigente foi encontrado.');
    }
    if (version.trim() !== currentTerm.version) {
      throw new ConflictError('A versão dos termos enviada não corresponde à versão vigente.');
    }
    return currentTerm;
  }
}
