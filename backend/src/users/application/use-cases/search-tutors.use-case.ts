import { Inject, Injectable } from '@nestjs/common';
import { InvalidRequestError } from '@/shared/errors/application.error';
import {
  USER_REPOSITORY,
  type UserRepository,
  type TutorSummary,
} from '../../domain/repositories/user.repository';

@Injectable()
export class SearchTutorsUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(query: string): Promise<TutorSummary[]> {
    const normalized = query.trim();
    if (normalized.length < 3 || normalized.length > 160) {
      throw new InvalidRequestError('A busca deve ter entre 3 e 160 caracteres.');
    }
    const tutors = await this.users.searchTutors(normalized);
    return tutors.map(({ id, name, email }) => ({ id, name, email }));
  }
}
