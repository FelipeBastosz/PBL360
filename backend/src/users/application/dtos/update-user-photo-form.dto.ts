import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserPhotoFormDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'JPEG, PNG ou WebP de até 2 MB.',
  })
  foto!: unknown;
}
