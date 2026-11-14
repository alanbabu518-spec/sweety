process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://sweety:sweety@localhost:5435/sweety_test";
process.env.JWT_SECRET = "test-secret";

// High limits so ordinary tests are never blocked. tests/ratelimit.test.js lowers them on purpose.
process.env.LOGIN_RATE_LIMIT_MAX = "1000";
process.env.REGISTER_RATE_LIMIT_MAX = "1000";
