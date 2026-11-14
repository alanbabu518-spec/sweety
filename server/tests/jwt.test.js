const jwt = require("jsonwebtoken");
const request = require("supertest");
const { app, pool, setupDb, resetDb, registerUser } = require("./helpers");

const secret = process.env.JWT_SECRET; // set in tests/setup.js
const now = () => Math.floor(Date.now() / 1000);
const encode = (object) =>
  Buffer.from(JSON.stringify(object)).toString("base64url");
const me = (token) =>
  request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(() => pool.end());

describe("JWT authentication", () => {
  test.each([
    ["GET", "/readings"],
    ["POST", "/readings"],
    ["PUT", "/readings/1"],
    ["DELETE", "/readings/1"],
    ["GET", "/reports/daily"],
    ["GET", "/reports/month-to-date"],
    ["GET", "/reports/monthly"],
    ["GET", "/auth/me"],
  ])("%s %s needs a token", async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Please log in to continue.");
  });

  test("a wrong header format is rejected", async () => {
    const token = await registerUser();
    for (const header of ["Basic abc", `Token ${token}`, "Bearer", token]) {
      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", header);
      expect(res.status).toBe(401);
    }
  });

  test("a valid token is accepted", async () => {
    const token = await registerUser();
    const res = await me(token);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("alan@test.com");
  });

  test("a garbage token is rejected", async () => {
    const res = await me("this.is.not-a-token");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe(
      "Your session has expired. Please log in again.",
    );
  });

  test("a token signed with a different secret is rejected", async () => {
    const forged = jwt.sign({ sub: 1 }, "some-other-secret");
    expect((await me(forged)).status).toBe(401);
  });

  test("an expired token is rejected", async () => {
    await registerUser();
    const expired = jwt.sign({ sub: 1, exp: now() - 60 }, secret);
    const res = await me(expired);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe(
      "Your session has expired. Please log in again.",
    );
  });

  test("a token with a tampered payload is rejected", async () => {
    const token = await registerUser();
    const [header, , signature] = token.split(".");
    const tampered = `${header}.${encode({ sub: 999, iat: now() })}.${signature}`;
    expect((await me(tampered)).status).toBe(401);
  });

  test('an unsigned token ("alg": "none") is rejected', async () => {
    const unsigned = `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: 1, iat: now() })}.`;
    expect((await me(unsigned)).status).toBe(401);
  });

  test("a token signed with another algorithm (HS512) is rejected, even with the right secret", async () => {
    await registerUser();
    const token = jwt.sign({ sub: 1 }, secret, { algorithm: "HS512" });
    expect((await me(token)).status).toBe(401);
  });

  test("a valid token for a user that does not exist gets 404 on /auth/me", async () => {
    const token = jwt.sign({ sub: 999999 }, secret);
    const res = await me(token);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found.");
  });
});
