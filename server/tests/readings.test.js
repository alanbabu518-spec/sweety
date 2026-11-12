const request = require("supertest");
const {
  app,
  pool,
  setupDb,
  resetDb,
  registerUser,
  addReading,
} = require("./helpers");

const day = "2026-10-15";

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(() => pool.end());

describe("readings API", () => {
  test("requires login", async () => {
    const res = await request(app).get("/readings");
    expect(res.status).toBe(401);
  });

  test("creates a reading", async () => {
    const token = await registerUser();
    const res = await addReading(token, {
      date: day,
      slot: "morning",
      value: 110,
    });
    expect(res.status).toBe(201);
    expect(res.body.reading).toMatchObject({
      date: day,
      slot: "morning",
      value: 110,
    });
  });

  test("only one reading per slot per day", async () => {
    const token = await registerUser();
    await addReading(token, { date: day, slot: "after_lunch", value: 130 });
    const res = await addReading(token, {
      date: day,
      slot: "after_lunch",
      value: 140,
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe(
      "You already have an After lunch reading for this date.",
    );
  });

  test("maximum 4 readings per day", async () => {
    const token = await registerUser();
    for (const slot of [
      "morning",
      "after_breakfast",
      "after_lunch",
      "after_dinner",
    ]) {
      await addReading(token, { date: day, slot, value: 120 });
    }
    const res = await addReading(token, {
      date: day,
      slot: "morning",
      value: 120,
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("You can add only 4 readings per day.");
  });

  test("rejects a future date", async () => {
    const token = await registerUser();
    const res = await addReading(token, {
      date: "2999-01-01",
      slot: "morning",
      value: 110,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Date cannot be in the future.");
  });

  test("a reading can be edited without clashing with itself", async () => {
    const token = await registerUser();
    const created = await addReading(token, {
      date: day,
      slot: "morning",
      value: 110,
    });
    const res = await request(app)
      .put(`/readings/${created.body.reading.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ value: 125 });
    expect(res.status).toBe(200);
    expect(res.body.reading.value).toBe(125);
  });

  test("a reading can be deleted", async () => {
    const token = await registerUser();
    const created = await addReading(token, {
      date: day,
      slot: "morning",
      value: 110,
    });
    const res = await request(app)
      .delete(`/readings/${created.body.reading.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  test("users cannot see, edit or delete each other's readings", async () => {
    const alice = await registerUser("alice@test.com");
    const bob = await registerUser("bob@test.com");
    const created = await addReading(alice, {
      date: day,
      slot: "morning",
      value: 110,
    });
    const id = created.body.reading.id;

    const list = await request(app)
      .get("/readings")
      .set("Authorization", `Bearer ${bob}`);
    expect(list.body.readings).toHaveLength(0);

    const edit = await request(app)
      .put(`/readings/${id}`)
      .set("Authorization", `Bearer ${bob}`)
      .send({ value: 300 });
    expect(edit.status).toBe(404);

    const del = await request(app)
      .delete(`/readings/${id}`)
      .set("Authorization", `Bearer ${bob}`);
    expect(del.status).toBe(404);
  });
});
