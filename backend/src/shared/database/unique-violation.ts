import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION = '23505';

interface PostgresDriverError {
  code?: string;
  constraint?: string;
}

export const violatedUniqueConstraint = (error: unknown): string | null => {
  if (!(error instanceof QueryFailedError)) {
    return null;
  }

  const driverError = error.driverError as PostgresDriverError;

  return driverError.code === UNIQUE_VIOLATION ? (driverError.constraint ?? '') : null;
};
