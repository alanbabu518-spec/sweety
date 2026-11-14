const request = require("supertest");
const { app, pool, setupDb, resetDb } = require("./helpers");

const valid = { name: "Alan", email: "alan@test.com", password: "password123" };

const register = (body) => request(app).post("/auth/register").send(body);
const login = (body) => request(app).post("/auth/login").send(body);
// Sends raw text as JSON, so we can test bodies that are not objects or not valid JSON.
const raw = (path, text) =>
  request(app).post(path).set("Content-Type", "application/json").send(text);

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(() => pool.end());

describe("POST /auth/register", () => {
  test("creates an account, trims the name and lower-cases the email", async () => {
    const res = await register({
      ...valid,
      name: "  Alan  ",
      email: "  Alan@Test.COM ",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({
      id: expect.any(Number),
      name: "Alan",
      email: "alan@test.com",
    });
    expect(typeof res.body.token).toBe("string");
  });

  test("never returns or stores the plain password", async () => {
    const res = await register(valid);
    expect(JSON.stringify(res.body)).not.toContain(valid.password);

    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE email = $1",
      [valid.email],
    );
    expect(rows[0].password_hash).not.toBe(valid.password);
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/); // a bcrypt hash
  });

  test.each([
    [
      "a missing name",
      { ...valid, name: undefined },
      "Please enter your name.",
    ],
    ["a blank name", { ...valid, name: "   " }, "Please enter your name."],
    [
      "a name sent as an array",
      { ...valid, name: ["Alan"] },
      "Please enter your name.",
    ],
    [
      "a name sent as an object",
      { ...valid, name: { first: "Alan" } },
      "Please enter your name.",
    ],
    [
      "a name sent as a number",
      { ...valid, name: 123 },
      "Please enter your name.",
    ],
    [
      "a name that is too long",
      { ...valid, name: "a".repeat(101) },
      "Name must be 100 characters or fewer.",
    ],
    [
      "a missing email",
      { ...valid, email: undefined },
      "Please enter a valid email address.",
    ],
    [
      "an email sent as an array",
      { ...valid, email: ["alan@test.com"] },
      "Please enter a valid email address.",
    ],
    [
      "an email without @",
      { ...valid, email: "alan.test.com" },
      "Please enter a valid email address.",
    ],
    [
      "an email without a domain dot",
      { ...valid, email: "alan@test" },
      "Please enter a valid email address.",
    ],
    [
      "an email with a space inside",
      { ...valid, email: "al an@test.com" },
      "Please enter a valid email address.",
    ],
    [
      "an email that is too long",
      { ...valid, email: `${"a".repeat(251)}@t.co` },
      "Please enter a valid email address.",
    ],
    [
      "a missing password",
      { ...valid, password: undefined },
      "Password must be at least 8 characters.",
    ],
    [
      "a password that is too short",
      { ...valid, password: "short" },
      "Password must be at least 8 characters.",
    ],
    [
      "a password sent as an array",
      { ...valid, password: ["password123"] },
      "Password must be at least 8 characters.",
    ],
    [
      "a password sent as a number",
      { ...valid, password: 123456789 },
      "Password must be at least 8 characters.",
    ],
    [
      "a password that is too long for bcrypt",
      { ...valid, password: "a".repeat(73) },
      "Password is too long. Please use 72 characters or fewer.",
    ],
  ])("rejects %s", async (label, body, message) => {
    const res = await register(body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: message });
  });

  test("accepts a password of exactly 8 and exactly 72 characters", async () => {
    expect((await register({ ...valid, password: "12345678" })).status).toBe(
      201,
    );
    expect(
      (
        await register({
          ...valid,
          email: "b@test.com",
          password: "a".repeat(72),
        })
      ).status,
    ).toBe(201);
  });

  test("rejects a duplicate email, even with different letter case", async () => {
    expect((await register(valid)).status).toBe(201);

    const res = await register({ ...valid, email: "ALAN@test.com" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("An account with this email already exists.");
  });

  test("an empty body is treated like missing fields", async () => {
    const res = await request(app).post("/auth/register");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please enter your name.");
  });

  test("a JSON array body is rejected", async () => {
    const res = await raw("/auth/register", "[]");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Request body must be a JSON object.");
  });

  test.each([
    ["null", "null"],
    ["a JSON string", '"just a string"'],
    ["a number", "42"],
    ["broken JSON", '{"email": '],
    ["plain text", "hello"],
  ])("a body that is %s is rejected as invalid JSON", async (label, text) => {
    const res = await raw("/auth/register", text);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Request body must be valid JSON.");
  });

  test("a body larger than the 10 KB limit is rejected", async () => {
    const res = await register({ ...valid, name: "x".repeat(20000) });
    expect(res.status).toBe(413);
    expect(res.body.error).toBe("Request body is too large.");
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await register(valid);
  });

  test("logs in with the right credentials", async () => {
    const res = await login({ email: valid.email, password: valid.password });
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: expect.any(Number),
      name: "Alan",
      email: valid.email,
    });
    expect(typeof res.body.token).toBe("string");
  });

  test("the email is not case-sensitive", async () => {
    const res = await login({
      email: " ALAN@Test.com ",
      password: valid.password,
    });
    expect(res.status).toBe(200);
  });

  test("a wrong password gets a generic error", async () => {
    const res = await login({ email: valid.email, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password.");
  });

  test("an unknown email gets the SAME error (so emails cannot be discovered)", async () => {
    const res = await login({
      email: "nobody@test.com",
      password: "password123",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password.");
  });

  test.each([
    ["an empty body", {}],
    ["a missing password", { email: "alan@test.com" }],
    ["a missing email", { password: "password123" }],
    ["blank values", { email: "  ", password: "   " }],
    [
      "an email sent as an array",
      { email: ["alan@test.com"], password: "password123" },
    ],
    [
      "a password sent as an object",
      { email: "alan@test.com", password: { a: 1 } },
    ],
  ])("rejects %s", async (label, body) => {
    const res = await login(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please enter your email and password.");
  });

  test("a password longer than bcrypt allows is simply 'invalid'", async () => {
    const res = await login({ email: valid.email, password: "a".repeat(5000) });
    expect(res.status).toBe(401);
  });

  test("the token from login works on a protected route", async () => {
    const { body } = await login({
      email: valid.email,
      password: valid.password,
    });
    const me = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(valid.email);
  });
});
