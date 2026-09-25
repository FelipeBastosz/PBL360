const TEST_DATABASE_SUFFIX = '_test';

process.env.JWT_SECRET ??= 'e2e-test-secret';

if (!process.env.DB_NAME?.endsWith(TEST_DATABASE_SUFFIX)) {
  process.env.DB_NAME = `pbl360${TEST_DATABASE_SUFFIX}`;
}
