import { BadRequestException, Param, ParseUUIDPipe } from '@nestjs/common';

export const UuidParam = (property: string): ParameterDecorator =>
  Param(
    property,
    new ParseUUIDPipe({
      exceptionFactory: () =>
        new BadRequestException(`O parâmetro "${property}" deve ser um UUID válido.`),
    }),
  );
