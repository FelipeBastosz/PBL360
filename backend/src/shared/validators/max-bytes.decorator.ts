import { ValidateBy, type ValidationOptions } from 'class-validator';

export const MaxBytes = (max: number, options?: ValidationOptions): PropertyDecorator =>
  ValidateBy(
    {
      name: 'maxBytes',
      constraints: [max],
      validator: {
        validate: (value: unknown) =>
          typeof value !== 'string' || Buffer.byteLength(value, 'utf8') <= max,
      },
    },
    options,
  );
