import { useCallback, useState } from 'react';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, string>>(
  initialValues: T,
  validate: (values: T) => FieldErrors<T>,
) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});

  const setValue = useCallback((field: keyof T, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  const validateAll = useCallback(() => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    return Object.values(nextErrors).every((error) => !error);
  }, [validate, values]);

  return { values, errors, setValue, validateAll };
}
