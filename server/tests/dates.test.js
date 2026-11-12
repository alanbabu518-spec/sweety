const {
  isValidDateString,
  firstOfMonth,
  previousMonthRange,
} = require("../src/utils/dates");

describe("isValidDateString", () => {
  test("accepts real dates", () => {
    expect(isValidDateString("2026-10-15")).toBe(true);
    expect(isValidDateString("2024-02-29")).toBe(true); // leap year
  });

  test("rejects fake or badly formatted dates", () => {
    expect(isValidDateString("2026-02-31")).toBe(false);
    expect(isValidDateString("2025-02-29")).toBe(false); // not a leap year
    expect(isValidDateString("15-10-2026")).toBe(false);
    expect(isValidDateString("")).toBe(false);
    expect(isValidDateString(undefined)).toBe(false);
  });
});

describe("firstOfMonth", () => {
  test("returns the 1st of the same month", () => {
    expect(firstOfMonth("2026-10-15")).toBe("2026-10-01");
  });
});

describe("previousMonthRange", () => {
  test("matches the example from the assignment", () => {
    expect(previousMonthRange("2026-10-15")).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });

  test("January rolls back to December of the previous year", () => {
    expect(previousMonthRange("2026-01-10")).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });

  test("handles February in normal and leap years", () => {
    expect(previousMonthRange("2026-03-31").to).toBe("2026-02-28");
    expect(previousMonthRange("2024-03-05").to).toBe("2024-02-29");
  });
});
