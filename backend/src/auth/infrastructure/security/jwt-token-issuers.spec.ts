import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_AUDIENCE } from '@/shared/security/access-token';
import { buildActiveStudent } from '../../testing/auth-fixtures';
import { JwtAccessTokenIssuer } from './jwt-access-token-issuer';
import { JwtPasswordResetTokenIssuer } from './jwt-password-reset-token-issuer';

const jwt = new JwtService({ secret: 'unit-test-secret', signOptions: { expiresIn: '1h' } });

describe('JWT token issuers', () => {
  const access = new JwtAccessTokenIssuer(jwt);
  const reset = new JwtPasswordResetTokenIssuer(jwt);

  it('issues access tokens with the user claims and token version', async () => {
    const token = await access.issueFor(buildActiveStudent({ tokenVersion: 4 }));

    await expect(
      jwt.verifyAsync(token.value, { audience: ACCESS_TOKEN_AUDIENCE }),
    ).resolves.toMatchObject({ sub: 'user-1', email: 'ana@discente.uefs.br', ver: 4 });
    expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('round-trips a password reset subject', async () => {
    const token = await reset.issueFor({ userId: 'user-1', tokenVersion: 2 });

    await expect(reset.verify(token.value)).resolves.toEqual({ userId: 'user-1', tokenVersion: 2 });
  });

  it('never accepts an access token as a reset token', async () => {
    const token = await access.issueFor(buildActiveStudent());

    await expect(reset.verify(token.value)).resolves.toBeNull();
  });

  it('never accepts a reset token as an access token', async () => {
    const token = await reset.issueFor({ userId: 'user-1', tokenVersion: 0 });

    await expect(
      jwt.verifyAsync(token.value, { audience: ACCESS_TOKEN_AUDIENCE }),
    ).rejects.toThrow();
  });

  it('rejects a tampered token', async () => {
    await expect(reset.verify('not-a-jwt')).resolves.toBeNull();
  });
});
