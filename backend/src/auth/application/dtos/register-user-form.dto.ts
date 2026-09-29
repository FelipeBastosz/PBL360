import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegisterUserDto } from './register-user.dto';

export class RegisterUserFormDto extends RegisterUserDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'JPEG, PNG ou WebP de até 2 MB. Obrigatória para ALUNO, opcional para PROFESSOR.',
  })
  foto?: unknown;
}
