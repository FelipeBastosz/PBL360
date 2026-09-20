import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NodemailerEmailVerificationSender } from './nodemailer-email-verification-sender';

jest.mock('nodemailer');

describe('NodemailerEmailVerificationSender', () => {
  let sender: NodemailerEmailVerificationSender;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'msg-test-id-123' });

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        NodemailerEmailVerificationSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SMTP_USER') return 'pbl360.ecomp@gmail.com';
              if (key === 'SMTP_PASS') return 'app-password-mock';
              return null;
            }),
          },
        },
      ],
    }).compile();

    sender = moduleRef.get(NodemailerEmailVerificationSender);
  });

  it('sends an email to the recipient with the verification code', async () => {
    const recipient = {
      userId: 'usr-1',
      name: 'Aluno Teste',
      email: 'aluno@uefs.br',
      code: '123456',
    };

    await sender.sendVerificationCode(recipient);

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: recipient.email,
        subject: 'Código de Verificação - PBL360',
      }),
    );
  });

  it('propagates the error when the transporter fails', async () => {
    const recipient = {
      userId: 'usr-1',
      name: 'Aluno Teste',
      email: 'aluno@uefs.br',
      code: '123456',
    };

    sendMailMock.mockRejectedValue(new Error('SMTP Failure'));

    await expect(sender.sendVerificationCode(recipient)).rejects.toThrow('SMTP Failure');
  });
});
