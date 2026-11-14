const {
  todayString,
  isValidTimeZone,
  firstOfMonth,
  previousMonthRange,
} = require("../src/utils/dates");

describe("todayString", () => {
  test("the same instant is a different calendar day in different time zones", () => {
    const instant = new Date("2026-11-13T20:00:00Z");
    expect(todayString("UTC", instant)).toBe("2026-11-13");
    expect(todayString("Asia/Kolkata", instant)).toBe("2026-11-14"); // 01:30 the next morning
    expect(todayString("America/Los_Angeles", instant)).toBe("2026-11-13"); // 12:00 noon
  });

  test("changes exactly at local midnight", () => {
    // India is UTC+5:30, so local midnight is 18:30 UTC.
    expect(todayString("Asia/Kolkata", new Date("2026-11-13T18:29:59Z"))).toBe(
      "2026-11-13",
    );
    expect(todayString("Asia/Kolkata", new Date("2026-11-13T18:30:00Z"))).toBe(
      "2026-11-14",
    );
  });

  test("month boundary: it is already the 1st in India while UTC is still the 31st", () => {
    const instant = new Date("2026-10-31T23:30:00Z");
    expect(todayString("UTC", instant)).toBe("2026-10-31");

    const india = todayString("Asia/Kolkata", instant);
    expect(india).toBe("2026-11-01");
    // ...and the reports use that date to pick the right ranges
    expect(firstOfMonth(india)).toBe("2026-11-01");
    expect(previousMonthRange(india)).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  test("year boundary", () => {
    const india = todayString("Asia/Kolkata", new Date("2026-12-31T20:00:00Z"));
    expect(india).toBe("2027-01-01");
    expect(previousMonthRange(india)).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
  });

  test("leap day", () => {
    expect(todayString("UTC", new Date("2028-02-29T10:00:00Z"))).toBe(
      "2028-02-29",
    );
  });

  test("defaults to UTC", () => {
    expect(todayString(undefined, new Date("2026-11-13T23:59:00Z"))).toBe(
      "2026-11-13",
    );
  });
});

describe("isValidTimeZone", () => {
  test.each(["UTC", "Asia/Kolkata", "America/New_York", "Pacific/Kiritimati"])(
    "accepts %s",
    (tz) => {
      expect(isValidTimeZone(tz)).toBe(true);
    },
  );

  test.each([
    "Mars/Phobos",
    "",
    "Asia/Kolkata; DROP TABLE users",
    undefined,
    null,
    42,
  ])("rejects %p", (tz) => {
    expect(isValidTimeZone(tz)).toBe(false);
  });

  test("rejects an array, even one that contains a valid zone", () => {
    expect(isValidTimeZone(["UTC"])).toBe(false);
  });
});
