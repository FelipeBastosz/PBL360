import { MaxBytes } from '@/shared/validators/max-bytes.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangeUserPasswordDto {
  @ApiProperty({ format: 'password', example: 'senha-atual-123' })
  @IsString({ message: 'A senha atual é obrigatória.' })
  @IsNotEmpty({ message: 'A senha atual não pode estar em branco.' })
  senhaAtual: string;

  @ApiProperty({ minLength: 8, maxLength: 72, format: 'password', example: 'nova-senha-secreta' })
  @IsString({ message: 'A nova senha é obrigatória.' })
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  @MaxLength(72, { message: 'A nova senha deve ter no máximo 72 caracteres.' })
  @MaxBytes(72, { message: 'A nova senha excede o tamanho máximo permitido.' })
  novaSenha: string;
}
