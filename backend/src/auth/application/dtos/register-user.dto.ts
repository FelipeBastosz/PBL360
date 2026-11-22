import { MaxBytes } from '@/shared/validators/max-bytes.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  Equals,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserTypePayload } from './user-type-payload.enum';

const INSTITUTIONAL_EMAIL = /^[^@\s]+@(discente\.)?uefs\.br$/i;
const REGISTRATION_NUMBER = /^\d{8}$/;

export class RegisterUserDto {
  @ApiProperty({ minLength: 3, maxLength: 120, example: 'Ana Souza' })
  @IsString({ message: 'O nome é obrigatório.' })
  @Length(3, 120, { message: 'O nome deve ter entre 3 e 120 caracteres.' })
  nome!: string;

  @ApiProperty({
    format: 'email',
    maxLength: 160,
    description: 'Professores usam @uefs.br e alunos usam @discente.uefs.br.',
    example: 'ana@discente.uefs.br',
  })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(160, { message: 'O e-mail deve ter no máximo 160 caracteres.' })
  @Matches(INSTITUTIONAL_EMAIL, {
    message: 'O e-mail deve ser institucional (@uefs.br ou @discente.uefs.br).',
  })
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 72, format: 'password', example: 'senha-secreta' })
  @IsString({ message: 'A senha é obrigatória.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  @MaxBytes(72, { message: 'A senha excede o tamanho máximo permitido.' })
  senha!: string;

  @ApiProperty({ enum: UserTypePayload, example: UserTypePayload.ALUNO })
  @IsEnum(UserTypePayload, { message: 'O tipo deve ser PROFESSOR ou ALUNO.' })
  tipo!: UserTypePayload;

  @ApiProperty({
    maxLength: 20,
    description: 'Versão vigente dos Termos de Uso e Política de Privacidade aceita no cadastro.',
    example: '1.2',
  })
  @IsString({ message: 'A versão dos termos é obrigatória.' })
  @IsNotEmpty({ message: 'A versão dos termos é obrigatória.' })
  @MaxLength(20, { message: 'A versão dos termos deve ter no máximo 20 caracteres.' })
  versaoTermo!: string;

  @ApiProperty({
    example: true,
    description: 'Deve ser true após a confirmação explícita de leitura e aceite dos termos.',
  })
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  @Equals(true, { message: 'É necessário aceitar os termos para concluir o cadastro.' })
  aceitaTermos!: boolean;

  @ApiPropertyOptional({
    pattern: '^\\d{8}$',
    description: 'Obrigatória para ALUNO, opcional para PROFESSOR.',
    example: '20240001',
  })
  @ValidateIf((dto: RegisterUserDto) => dto.tipo === UserTypePayload.ALUNO || dto.matricula != null)
  @IsNotEmpty({ message: 'A matrícula é obrigatória para alunos.' })
  @Matches(REGISTRATION_NUMBER, { message: 'A matrícula deve conter exatamente 8 dígitos.' })
  matricula?: string;
}
