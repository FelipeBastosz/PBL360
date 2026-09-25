export interface CodeRecipient {
  userId: string;
  name: string;
  email: string;
  code: string;
}

export interface CodeSender {
  sendCode(recipient: CodeRecipient): Promise<void>;
}
