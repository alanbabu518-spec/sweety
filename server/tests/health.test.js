const request = require("supertest");
const config = require("../src/config");
const { app, pool } = require("./helpers");

afterAll(() => pool.end());

describe("health checks", () => {
  test("GET /health says the process is running", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  test("GET /health/ready is 200 when PostgreSQL answers", async () => {
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ready", database: "up" });
  });

  test("GET /health/ready is 503 when PostgreSQL is unreachable, without leaking details", async () => {
    const query = jest
      .spyOn(pool, "query")
      .mockRejectedValueOnce(new Error("connect ECONNREFUSED 10.0.0.5:5432"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app).get("/health/ready");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "unavailable", database: "down" });
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|10\.0\.0\.5/);

    query.mockRestore();
    log.mockRestore();
  });
});

describe("security headers and CORS", () => {
  test("Helmet headers are set and X-Powered-By is hidden", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  test("CORS allows only the configured client origin", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", config.clientOrigin);
    expect(res.headers["access-control-allow-origin"]).toBe(
      config.clientOrigin,
    );

    const other = await request(app)
      .get("/health")
      .set("Origin", "https://evil.example.com");
    expect(other.headers["access-control-allow-origin"]).toBe(
      config.clientOrigin,
    ); // never the evil origin
  });

  test("the browser pre-flight request may send the X-Timezone header", async () => {
    const res = await request(app)
      .options("/readings")
      .set("Origin", config.clientOrigin)
      .set("Access-Control-Request-Method", "POST")
      .set(
        "Access-Control-Request-Headers",
        "authorization,content-type,x-timezone",
      );

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-headers"]).toMatch(/x-timezone/i);
  });
});
