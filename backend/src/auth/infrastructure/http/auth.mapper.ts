import { UserType } from '@/users/domain/enums/user-type.enum';
import type { User } from '@/users/domain/entities/user.entity';
import type { AuthenticatedSession } from '../../application/authenticated-session';
import type { RegisterResponseDto } from '../../application/dtos/register-response.dto';
import type { RegisterUserDto } from '../../application/dtos/register-user.dto';
import type { SessionResponseDto } from '../../application/dtos/session-response.dto';
import type { UserResponseDto } from '../../application/dtos/user-response.dto';
import type { PasswordResetTokenResponseDto } from '../../application/dtos/password-reset-token-response.dto';
import { UserTypePayload } from '../../application/dtos/user-type-payload.enum';
import type { ValidatePasswordResetCodeDto } from '../../application/dtos/validate-password-reset-code.dto';
import type { VerifyEmailCodeDto } from '../../application/dtos/verify-email-code.dto';
import type { PasswordResetToken } from '../../domain/services/password-reset-token-issuer';
import type { ValidatePasswordResetCodeInput } from '../../application/use-cases/validate-password-reset-code.use-case';
import type { VerifyEmailCodeInput } from '../../application/use-cases/verify-email-code.use-case';

const DOMAIN_TYPE: Record<UserTypePayload, UserType> = {
  [UserTypePayload.PROFESSOR]: UserType.TUTOR,
  [UserTypePayload.ALUNO]: UserType.STUDENT,
};

const PAYLOAD_TYPE: Record<UserType, UserTypePayload> = {
  [UserType.TUTOR]: UserTypePayload.PROFESSOR,
  [UserType.STUDENT]: UserTypePayload.ALUNO,
};

export const toRegisterUserInput = (dto: RegisterUserDto) => ({
  name: dto.nome,
  email: dto.email,
  password: dto.senha,
  type: DOMAIN_TYPE[dto.tipo],
  registrationNumber: dto.matricula ?? null,
  photoUrl: dto.fotoUrl ?? null,
});

export const toVerifyEmailCodeInput = (dto: VerifyEmailCodeDto): VerifyEmailCodeInput => ({
  userId: dto.usuarioId,
  email: dto.email,
  code: dto.codigo,
});

export const toUserResponse = (user: User): UserResponseDto => ({
  id: user.id,
  nome: user.name,
  email: user.email,
  tipo: PAYLOAD_TYPE[user.type],
  matricula: user.registrationNumber,
  fotoUrl: user.photoUrl,
  ativo: user.active,
  criadoEm: user.createdAt,
});

export const toSessionResponse = (session: AuthenticatedSession): SessionResponseDto => ({
  token: session.accessToken.value,
  expiraEm: session.accessToken.expiresAt,
  usuario: toUserResponse(session.user),
});

export const toRegisterResponse = (user: User, mensagem: string): RegisterResponseDto => ({
  mensagem,
  usuarioId: user.id,
  usuario: toUserResponse(user),
});

export const toValidatePasswordResetCodeInput = (
  dto: ValidatePasswordResetCodeDto,
): ValidatePasswordResetCodeInput => ({ email: dto.email, code: dto.codigo });

export const toPasswordResetTokenResponse = (
  token: PasswordResetToken,
): PasswordResetTokenResponseDto => ({ token: token.value, expiraEm: token.expiresAt });
