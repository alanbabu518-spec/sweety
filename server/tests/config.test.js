const { loadConfig } = require("../src/config");

// NODE_ENV "test" keeps loadConfig quiet (no "JWT_SECRET not set" warning).
const base = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://user:pass@localhost:5432/db",
};
const production = {
  ...base,
  NODE_ENV: "production",
  JWT_SECRET: "x".repeat(40),
  CLIENT_ORIGIN: "https://sweety.example.com",
};

describe("loadConfig", () => {
  test("applies safe defaults", () => {
    const config = loadConfig({ ...base, JWT_SECRET: "dev-secret" });
    expect(config).toMatchObject({
      port: 4000,
      jwtExpiresIn: "7d",
      appTimezone: "UTC",
      trustProxy: 0,
      isProduction: false,
    });
    expect(config.rateLimit).toEqual({
      windowMs: 15 * 60 * 1000,
      loginMax: 10,
      registerMax: 10,
    });
  });

  test("DATABASE_URL is always required", () => {
    expect(() => loadConfig({ JWT_SECRET: "dev-secret" })).toThrow(
      /DATABASE_URL is required/,
    );
  });

  test("development falls back to a default JWT secret (with a warning)", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(loadConfig({ ...base, NODE_ENV: "development" }).jwtSecret).toBe(
      "dev-only-secret",
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test("production never falls back to a default JWT secret", () => {
    const { JWT_SECRET, ...withoutSecret } = production;
    expect(() => loadConfig(withoutSecret)).toThrow(
      /JWT_SECRET is required in production/,
    );
  });

  test.each([
    ["too short", "short-secret"],
    ["the .env.example placeholder", "change-me-to-a-long-random-string"],
    ["the development default", "dev-only-secret"],
  ])("production rejects a JWT secret that is %s", (label, secret) => {
    expect(() => loadConfig({ ...production, JWT_SECRET: secret })).toThrow(
      /JWT_SECRET must be/,
    );
  });

  test("production accepts a strong secret", () => {
    const config = loadConfig(production);
    expect(config.isProduction).toBe(true);
    expect(config.jwtSecret).toBe("x".repeat(40));
  });

  test("production requires CLIENT_ORIGIN", () => {
    const { CLIENT_ORIGIN, ...withoutOrigin } = production;
    expect(() => loadConfig(withoutOrigin)).toThrow(
      /CLIENT_ORIGIN is required in production/,
    );
  });

  test("CLIENT_ORIGIN must be a URL", () => {
    expect(() => loadConfig({ ...base, CLIENT_ORIGIN: "not a url" })).toThrow(
      /CLIENT_ORIGIN must be a valid URL/,
    );
  });

  test.each(["abc", "-1", "70000", "4000.5"])("rejects PORT=%s", (port) => {
    expect(() => loadConfig({ ...base, PORT: port })).toThrow(
      /PORT must be a whole number/,
    );
  });

  test("rejects an unknown APP_TIMEZONE", () => {
    expect(() => loadConfig({ ...base, APP_TIMEZONE: "Mars/Phobos" })).toThrow(
      /APP_TIMEZONE/,
    );
  });

  test("reads rate-limit settings", () => {
    const config = loadConfig({
      ...base,
      RATE_LIMIT_WINDOW_MINUTES: "5",
      LOGIN_RATE_LIMIT_MAX: "3",
      REGISTER_RATE_LIMIT_MAX: "2",
    });
    expect(config.rateLimit).toEqual({
      windowMs: 5 * 60 * 1000,
      loginMax: 3,
      registerMax: 2,
    });
  });

  test("reports every problem at once", () => {
    let message = "";
    try {
      loadConfig({ NODE_ENV: "production", PORT: "abc" });
    } catch (err) {
      message = err.message;
    }
    expect(message).toMatch(/DATABASE_URL/);
    expect(message).toMatch(/JWT_SECRET/);
    expect(message).toMatch(/PORT/);
  });
});
