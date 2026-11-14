const request = require("supertest");
const {
  app,
  pool,
  setupDb,
  resetDb,
  registerUser,
  addReading,
} = require("./helpers");

const { todayString } = require("../src/utils/dates");

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

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe("readings API: glucose value boundaries and bad types", () => {
  test.each([
    ["the lowest allowed value", 40, 201],
    ["the highest allowed value", 600, 201],
    ["a numeric string (what the form sends)", "110", 201],
    ["one below the minimum", 39, 400],
    ["one above the maximum", 601, 400],
    ["zero", 0, 400],
    ["a negative number", -1, 400],
    ["a decimal number", 100.5, 400],
    ["a decimal string", "100.5", 400],
    ["scientific notation", "1e2", 400],
    ["a hex string", "0x64", 400],
    ["text", "abc", 400],
    ["an array", [100], 400],
    ["an object", { n: 100 }, 400],
    ["a boolean", true, 400],
  ])("%s", async (label, value, status) => {
    const token = await registerUser();
    const res = await addReading(token, { date: day, slot: "morning", value });

    expect(res.status).toBe(status);
    if (status === 400) {
      expect(res.body.error).toBe("Value must be between 40 and 600 mg/dl.");
    }
  });

  test.each([
    ["is missing", undefined],
    ["is an empty string", ""],
    ["is null", null],
  ])("a value that %s asks for a value", async (label, value) => {
    const token = await registerUser();
    const res = await addReading(token, { date: day, slot: "morning", value });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please enter a glucose value.");
  });

  test.each([
    ["a fake date", "2026-02-30"],
    ["the wrong format", "15-10-2026"],
    ["a number", 20261015],
    ["an array", [day]],
    ["a missing date", undefined],
  ])("rejects %s", async (label, date) => {
    const token = await registerUser();
    const res = await addReading(token, { date, slot: "morning", value: 110 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please choose a valid date.");
  });

  test.each([
    ["an unknown slot", "midnight"],
    ["an array", ["morning"]],
    ["a missing slot", undefined],
    ["a prototype name", "toString"],
  ])("rejects %s (400, never a server error)", async (label, slot) => {
    const token = await registerUser();
    const res = await addReading(token, { date: day, slot, value: 110 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please choose a time slot.");
  });

  test("rejects a body that is a JSON array", async () => {
    const token = await registerUser();
    const res = await request(app)
      .post("/readings")
      .set(auth(token))
      .set("Content-Type", "application/json")
      .send("[]");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Request body must be a JSON object.");
  });
});

describe("readings API: ids and updates", () => {
  test.each(["abc", "0", "-1", "1.5", "1e3", "0x10", "99999999999"])(
    "id %s is simply 'not found' (never a server error)",
    async (id) => {
      const token = await registerUser();

      const edit = await request(app)
        .put(`/readings/${id}`)
        .set(auth(token))
        .send({ value: 100 });
      expect(edit.status).toBe(404);
      expect(edit.body.error).toBe("Reading not found.");

      const del = await request(app).delete(`/readings/${id}`).set(auth(token));
      expect(del.status).toBe(404);
    },
  );

  test("a reading cannot be moved into a slot that is already used", async () => {
    const token = await registerUser();
    const morning = await addReading(token, {
      date: day,
      slot: "morning",
      value: 100,
    });
    await addReading(token, { date: day, slot: "after_lunch", value: 130 });

    const res = await request(app)
      .put(`/readings/${morning.body.reading.id}`)
      .set(auth(token))
      .send({ slot: "after_lunch" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(
      "You already have an After lunch reading for this date.",
    );
  });

  test("an edit cannot move a reading into the future", async () => {
    const token = await registerUser();
    const created = await addReading(token, {
      date: day,
      slot: "morning",
      value: 100,
    });

    const res = await request(app)
      .put(`/readings/${created.body.reading.id}`)
      .set(auth(token))
      .send({ date: "2999-01-01" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Date cannot be in the future.");
  });

  test("a failed edit leaves the reading unchanged", async () => {
    const token = await registerUser();
    const created = await addReading(token, {
      date: day,
      slot: "morning",
      value: 100,
    });

    const bad = await request(app)
      .put(`/readings/${created.body.reading.id}`)
      .set(auth(token))
      .send({ value: 601 });
    expect(bad.status).toBe(400);

    const list = await request(app)
      .get("/readings")
      .query({ date: day })
      .set(auth(token));
    expect(list.body.readings[0].value).toBe(100);
  });
});

describe("readings API: data isolation between users", () => {
  test("two users can each have a reading for the same slot and day", async () => {
    const alice = await registerUser("alice@test.com");
    const bob = await registerUser("bob@test.com");

    expect(
      (await addReading(alice, { date: day, slot: "morning", value: 100 }))
        .status,
    ).toBe(201);
    expect(
      (await addReading(bob, { date: day, slot: "morning", value: 200 }))
        .status,
    ).toBe(201);

    const aliceList = await request(app)
      .get("/readings")
      .query({ date: day })
      .set(auth(alice));
    const bobList = await request(app)
      .get("/readings")
      .query({ date: day })
      .set(auth(bob));
    expect(aliceList.body.readings.map((r) => r.value)).toEqual([100]);
    expect(bobList.body.readings.map((r) => r.value)).toEqual([200]);
  });

  test("one user's four readings do not use up another user's daily limit", async () => {
    const alice = await registerUser("alice@test.com");
    const bob = await registerUser("bob@test.com");
    for (const slot of [
      "morning",
      "after_breakfast",
      "after_lunch",
      "after_dinner",
    ]) {
      await addReading(alice, { date: day, slot, value: 120 });
    }

    const res = await addReading(bob, {
      date: day,
      slot: "morning",
      value: 110,
    });
    expect(res.status).toBe(201);
  });
});

describe("readings API: 'today' follows the user's time zone (X-Timezone header)", () => {
  // Pacific/Kiritimati (UTC+14) and Etc/GMT+12 (UTC-12) are 26 hours apart, so their
  // calendar dates are ALWAYS different, whatever time the test runs.
  const ahead = "Pacific/Kiritimati";
  const behind = "Etc/GMT+12";

  const post = (token, timezone, date) =>
    request(app)
      .post("/readings")
      .set(auth(token))
      .set("X-Timezone", timezone)
      .send({ date, slot: "morning", value: 110 });

  test("a date that is 'today' for the user is accepted", async () => {
    const token = await registerUser();
    const res = await post(token, ahead, todayString(ahead));
    expect(res.status).toBe(201);
  });

  test("the same date is 'the future' for a user whose clock is far behind", async () => {
    const token = await registerUser();
    const res = await post(token, behind, todayString(ahead));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Date cannot be in the future.");
  });

  test("an invalid time zone header is ignored (falls back to the server default)", async () => {
    const token = await registerUser();
    const res = await post(token, "Not/AZone", "2999-01-01");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Date cannot be in the future.");
  });

  test("reports use the user's 'today' when no date is given", async () => {
    const token = await registerUser();
    for (const zone of [ahead, behind]) {
      const res = await request(app)
        .get("/reports/daily")
        .set(auth(token))
        .set("X-Timezone", zone);
      expect(res.status).toBe(200);
      expect(res.body.report.range.from).toBe(todayString(zone));
    }
  });
});
