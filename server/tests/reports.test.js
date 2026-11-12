const {
  pool,
  setupDb,
  resetDb,
  registerUser,
  addReading,
  getReport,
} = require("./helpers");

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(() => pool.end());

async function seed(token) {
  const rows = [
    ["2026-08-31", "morning", 500], // before September
    ["2026-09-01", "morning", 80], // first day of previous month
    ["2026-09-30", "morning", 200], // last day of previous month
    ["2026-10-01", "morning", 90], // first day of selected month
    ["2026-10-15", "morning", 100],
    ["2026-10-15", "after_breakfast", 150],
    ["2026-10-15", "after_lunch", 130],
    ["2026-10-16", "morning", 300], // after the selected date
  ];
  for (const [date, slot, value] of rows) {
    await addReading(token, { date, slot, value });
  }
}

describe("reports", () => {
  test("daily report: stats and the list of readings with slots", async () => {
    const token = await registerUser();
    await seed(token);
    const { body } = await getReport(token, "daily", "2026-10-15");

    expect(body.report.range).toEqual({ from: "2026-10-15", to: "2026-10-15" });
    expect(body.report.stats).toEqual({
      count: 3,
      highest: 150,
      lowest: 100,
      average: 126.7,
    });
    expect(body.report.readings.map((r) => r.slotLabel)).toEqual([
      "Morning (fasting)",
      "After breakfast",
      "After lunch",
    ]);
  });

  test("month-to-date runs from the 1st to the selected date", async () => {
    const token = await registerUser();
    await seed(token);
    const { body } = await getReport(token, "month-to-date", "2026-10-15");

    expect(body.report.range).toEqual({ from: "2026-10-01", to: "2026-10-15" });
    expect(body.report.stats).toEqual({
      count: 4,
      highest: 150,
      lowest: 90,
      average: 117.5,
    });
  });

  test("monthly covers the whole previous month", async () => {
    const token = await registerUser();
    await seed(token);
    const { body } = await getReport(token, "monthly", "2026-10-15");

    expect(body.report.range).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(body.report.stats).toEqual({
      count: 2,
      highest: 200,
      lowest: 80,
      average: 140,
    });
  });

  test("a day with no readings returns an empty result", async () => {
    const token = await registerUser();
    const { body } = await getReport(token, "daily", "2026-10-20");

    expect(body.report.stats).toEqual({
      count: 0,
      highest: null,
      lowest: null,
      average: null,
    });
    expect(body.report.readings).toEqual([]);
  });

  test("reports only include the logged-in user's readings", async () => {
    const alice = await registerUser("alice@test.com");
    const bob = await registerUser("bob@test.com");
    await seed(alice);

    const { body } = await getReport(bob, "month-to-date", "2026-10-15");
    expect(body.report.stats.count).toBe(0);
  });

  test("rejects a malformed date", async () => {
    const token = await registerUser();
    const res = await getReport(token, "daily", "not-a-date");
    expect(res.status).toBe(400);
  });
});
