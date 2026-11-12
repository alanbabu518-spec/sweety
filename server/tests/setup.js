process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://sweety:sweety@localhost:5435/sweety_test';
process.env.JWT_SECRET = 'test-secret';