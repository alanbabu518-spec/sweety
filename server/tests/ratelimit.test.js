// Set LOW limits before the app is loaded (config reads them when it is first required).
process.env.LOGIN_RATE_LIMIT_MAX = "3";
process.env.REGISTER_RATE_LIMIT_MAX = "3";

const bcrypt = require("bcrypt");
const request = require("supertest");
const { app, pool, setupDb, resetDb } = require("./helpers");

const email = "alan@test.com";
const password = "password123";

// Create the user directly in the database, so the test does not use up the register limit.
async function createUser() {
  const hash = await bcrypt.hash(password, 4);
  await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ('Alan', $1, $2)",
    [email, hash],
  );
}
const login = (pw) =>
  request(app).post("/auth/login").send({ email, password: pw });

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(() => pool.end());

// The limiter keeps its counters in memory for the whole file, so the ORDER of these tests matters.
describe("rate limiting", () => {
  test("successful logins do not count towards the limit", async () => {
    await createUser();
    for (let i = 0; i < 6; i++) {
      expect((await login(password)).status).toBe(200);
    }
  });

  test("login is blocked after too many FAILED attempts", async () => {
    await createUser();
    for (let i = 0; i < 3; i++) {
      expect((await login("wrong-password")).status).toBe(401);
    }

    const blocked = await login("wrong-password");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many attempts/i);
    expect(blocked.headers["retry-after"]).toBeDefined();

    // While locked out, even the correct password is refused.
    expect((await login(password)).status).toBe(429);
  });

  test("other endpoints are not affected by the login lockout", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  test("registration is blocked after too many requests", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/auth/register")
        .send({ name: "Alan", email: `user${i}@test.com`, password });
      expect(res.status).toBe(201);
    }

    const blocked = await request(app)
      .post("/auth/register")
      .send({ name: "Alan", email: "one-too-many@test.com", password });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many attempts/i);
  });
});
