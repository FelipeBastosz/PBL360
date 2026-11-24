import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, registerDecorator, type ValidationOptions } from 'class-validator';
import {
  isValidHttpsDeliveryUrl,
  MAX_DELIVERY_URL_LENGTH,
} from '../../domain/entities/delivery-url';

const IsHttpsDeliveryUrl = (options?: ValidationOptions) => {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isHttpsDeliveryUrl',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) => isValidHttpsDeliveryUrl(value),
      },
    });
  };
};

export class RegisterProblemDeliveryDto {
  @ApiProperty({
    example: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp',
    description: 'Link HTTPS da entrega vinculada ao problema (ex.: Google Drive ou GitHub).',
    maxLength: MAX_DELIVERY_URL_LENGTH,
  })
  @IsString({ message: 'A URL da entrega é obrigatória e deve ser um texto.' })
  @MaxLength(MAX_DELIVERY_URL_LENGTH, {
    message: `A URL da entrega deve ter no máximo ${MAX_DELIVERY_URL_LENGTH} caracteres.`,
  })
  @IsHttpsDeliveryUrl({ message: 'Informe uma URL HTTPS válida para a entrega.' })
  url!: string;
}
