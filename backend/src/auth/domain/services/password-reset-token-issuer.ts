export interface PasswordResetToken {
  value: string;
  expiresAt: Date;
}

export interface PasswordResetSubject {
  userId: string;
  tokenVersion: number;
}

export interface PasswordResetTokenIssuer {
  issueFor(subject: PasswordResetSubject): Promise<PasswordResetToken>;
  verify(token: string): Promise<PasswordResetSubject | null>;
}

export const PASSWORD_RESET_TOKEN_ISSUER = Symbol('PasswordResetTokenIssuer');
