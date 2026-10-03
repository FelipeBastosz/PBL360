export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidRequestError extends ApplicationError {}

export class UnauthorizedError extends ApplicationError {}

export class ForbiddenError extends ApplicationError {}

export class NotFoundError extends ApplicationError {}

export class ConflictError extends ApplicationError {
  constructor(
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export class UnprocessableEntityError extends ApplicationError {}
