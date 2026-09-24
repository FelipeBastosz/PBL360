import { DomainError } from '@/shared/errors/domain.error';

export class InvalidProblemError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProblemError';
  }
}
