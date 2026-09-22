export interface PasswordResetRecipient {
  userId: string;
  name: string;
  email: string;
  code: string;
}

export interface PasswordResetSender {
  sendResetCode(recipient: PasswordResetRecipient): Promise<void>;
}

export const PASSWORD_RESET_SENDER = Symbol('PasswordResetSender');
