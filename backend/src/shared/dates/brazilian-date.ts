import { registerDecorator, type ValidationOptions } from 'class-validator';

const BRAZILIAN_DATE = /^(\d{2})-(\d{2})-(\d{4})$/;

const isCalendarDate = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const match = BRAZILIAN_DATE.exec(value);
  if (!match) return false;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
};

export const toIsoDate = (value: string): string => {
  const match = BRAZILIAN_DATE.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

export const toBrazilianDate = (value: string | null): string | null => {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
};

export const IsBrazilianDate =
  (options?: ValidationOptions): PropertyDecorator =>
  (target, propertyKey) => {
    registerDecorator({
      name: 'isBrazilianDate',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      options,
      validator: {
        validate: isCalendarDate,
      },
    });
  };
