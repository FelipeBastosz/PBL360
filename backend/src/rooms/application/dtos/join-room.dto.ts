import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class JoinRoomByCodeDto {
  @ApiProperty({ description: 'Código de ingresso da sala.', example: 'aB7kP2x9' })
  @IsString({ message: 'O código da sala deve ser um texto.' })
  @Matches(/^[A-Za-z0-9]{8}$/, { message: 'O código da sala é inválido.' })
  codigoSala: string;
}

export class JoinRoomByLinkDto {
  @ApiProperty({
    description: 'Link de convite no formato https://pbl360.com/salas/{codigoSala}.',
    example: 'https://pbl360.com/salas/aB7kP2x9',
    maxLength: 2048,
  })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'O link de ingresso é inválido.' },
  )
  @MaxLength(2048, { message: 'O link de ingresso é inválido.' })
  link: string;
}
