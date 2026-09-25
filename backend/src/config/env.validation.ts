type Env = Record<string, string | undefined>;

export const JWT_SECRET_PLACEHOLDER = 'change-me-in-every-environment';
const MIN_PRODUCTION_SECRET_LENGTH = 32;
const NODE_ENVS = ['development', 'test', 'production'];
const INTEGER_KEYS = ['PORT', 'DB_PORT', 'BCRYPT_ROUNDS'];
const REQUIRED_IN_PRODUCTION = [
  'DB_HOST',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'CORS_ORIGIN',
  'SMTP_USER',
  'SMTP_PASS',
];

const isBlank = (value: string | undefined): boolean => value === undefined || value.trim() === '';

const checkNodeEnv = (env: Env): string[] =>
  env.NODE_ENV === undefined || NODE_ENVS.includes(env.NODE_ENV)
    ? []
    : [`NODE_ENV must be one of: ${NODE_ENVS.join(', ')}.`];

const checkIntegers = (env: Env): string[] =>
  INTEGER_KEYS.filter((key) => env[key] !== undefined && !/^\d+$/.test(env[key])).map(
    (key) => `${key} must be a positive integer.`,
  );

const checkJwtSecret = (env: Env, production: boolean): string[] => {
  if (isBlank(env.JWT_SECRET)) {
    return ['JWT_SECRET is required.'];
  }

  const secret = env.JWT_SECRET ?? '';
  const weak = secret === JWT_SECRET_PLACEHOLDER || secret.length < MIN_PRODUCTION_SECRET_LENGTH;

  return production && weak
    ? [`JWT_SECRET must have at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production.`]
    : [];
};

const checkProduction = (env: Env): string[] => {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => isBlank(env[key])).map(
    (key) => `${key} is required in production.`,
  );

  return env.DB_SYNCHRONIZE === 'true'
    ? [...missing, 'DB_SYNCHRONIZE cannot be enabled in production.']
    : missing;
};

export const validateEnv = (env: Env): Env => {
  const production = env.NODE_ENV === 'production';
  const errors = [
    ...checkNodeEnv(env),
    ...checkIntegers(env),
    ...checkJwtSecret(env, production),
    ...(production ? checkProduction(env) : []),
  ];

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return env;
};
