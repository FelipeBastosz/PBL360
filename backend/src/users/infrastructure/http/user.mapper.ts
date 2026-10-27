import { UserType } from '../../domain/enums/user-type.enum';
import type { User } from '../../domain/entities/user.entity';
import { UserTypePayload } from '@/auth/application/dtos/user-type-payload.enum';
import type { UserProfileResponseDto } from '../../application/dtos/user-profile-response.dto';

const PAYLOAD_TYPE: Record<UserType, UserTypePayload> = {
  [UserType.TUTOR]: UserTypePayload.PROFESSOR,
  [UserType.STUDENT]: UserTypePayload.ALUNO,
};

export const toUserProfileResponse = (user: User): UserProfileResponseDto => ({
  id: user.id,
  nome: user.name,
  email: user.email,
  tipo: PAYLOAD_TYPE[user.type],
  matricula: user.registrationNumber,
  possuiFoto: user.hasPhoto,
});
