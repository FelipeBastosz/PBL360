import type { TutorResponseDto } from '../../application/dtos/tutor-response.dto';
import type { TutorSummary } from '../../domain/repositories/user.repository';

export const toTutorResponse = (tutor: TutorSummary): TutorResponseDto => ({
  id: tutor.id,
  nome: tutor.name,
  email: tutor.email,
});
