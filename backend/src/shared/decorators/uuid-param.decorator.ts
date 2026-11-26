import { BadRequestException, Param, ParseUUIDPipe } from '@nestjs/common';

export const UuidParam = (property: string, version?: '3' | '4' | '5' | '7'): ParameterDecorator =>
  Param(
    property,
    new ParseUUIDPipe({
      version,
      exceptionFactory: () =>
        new BadRequestException(`O parâmetro "${property}" deve ser um UUID válido.`),
    }),
  );
