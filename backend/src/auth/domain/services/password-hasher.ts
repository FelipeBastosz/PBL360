export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  matches(plainPassword: string, passwordHash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PasswordHasher');
