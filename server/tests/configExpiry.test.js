const { loadConfig } = require("../src/config");

const base = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://user:pass@localhost:5432/db",
  JWT_SECRET: "dev-secret",
};

describe("JWT_EXPIRES_IN validation", () => {
  test("defaults to 7d", () => {
    expect(loadConfig(base).jwtExpiresIn).toBe("7d");
  });

  test.each(["60s", "30m", "12h", "7d", "2w"])("accepts %s", (value) => {
    expect(loadConfig({ ...base, JWT_EXPIRES_IN: value }).jwtExpiresIn).toBe(
      value,
    );
  });

  test.each(["3600", "abc", "-5d", "0d", "7days", "1.5h", "d"])(
    "rejects %s",
    (value) => {
      expect(() => loadConfig({ ...base, JWT_EXPIRES_IN: value })).toThrow(
        /JWT_EXPIRES_IN/,
      );
    },
  );
});
