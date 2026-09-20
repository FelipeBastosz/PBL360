export interface EmailVerificationRecipient {
  userId: string;
  name: string;
  email: string;
  code: string;
}

export interface EmailVerificationSender {
  sendVerificationCode(recipient: EmailVerificationRecipient): Promise<void>;
}

export const EMAIL_VERIFICATION_SENDER = Symbol('EmailVerificationSender');
