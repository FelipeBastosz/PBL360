export interface PasswordResetToken {
  value: string;
  expiresAt: Date;
}

export interface PasswordResetTokenIssuer {
  issueFor(userId: string): Promise<PasswordResetToken>;

  verify(token: string): Promise<string | null>;
}

export const PASSWORD_RESET_TOKEN_ISSUER = Symbol('PasswordResetTokenIssuer');
