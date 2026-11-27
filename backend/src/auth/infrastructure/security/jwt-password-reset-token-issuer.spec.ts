import type { JwtService } from '@nestjs/jwt';
import { PASSWORD_RESET_AUDIENCE } from '@/shared/security/access-token';
import { JwtPasswordResetTokenIssuer } from './jwt-password-reset-token-issuer';

describe('JwtPasswordResetTokenIssuer', () => {
  const jwt = {
    signAsync: jest.fn(),
    decode: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const issuer = new JwtPasswordResetTokenIssuer(jwt as unknown as JwtService);

  beforeEach(() => jest.clearAllMocks());

  it('issues a short-lived token with the reset audience and returns its expiration', async () => {
    jwt.signAsync.mockResolvedValue('token');
    jwt.decode.mockReturnValue({ exp: 1_800_000_000 });

    await expect(issuer.issueFor({ userId: 'user-1', tokenVersion: 4 })).resolves.toEqual({
      value: 'token',
      expiresAt: new Date(1_800_000_000 * 1000),
    });
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'user-1', ver: 4 },
      { expiresIn: '10m', audience: PASSWORD_RESET_AUDIENCE },
    );
  });

  it('returns the subject for a token with a numeric version', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-2', ver: 7 });

    await expect(issuer.verify('valid-token')).resolves.toEqual({
      userId: 'user-2',
      tokenVersion: 7,
    });
    expect(jwt.verifyAsync).toHaveBeenCalledWith('valid-token', {
      audience: PASSWORD_RESET_AUDIENCE,
    });
  });

  it('rejects tokens with a missing or nonnumeric version', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-2', ver: '7' });
    await expect(issuer.verify('invalid-claims')).resolves.toBeNull();

    jwt.verifyAsync.mockResolvedValue({ sub: 'user-2' });
    await expect(issuer.verify('missing-version')).resolves.toBeNull();
  });

  it('returns null when JWT verification throws', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('invalid token'));
    await expect(issuer.verify('expired-token')).resolves.toBeNull();
  });
});
