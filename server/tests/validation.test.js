const { validateFields } = require("../src/services/readingsService");

const good = { value: 120, date: "2026-10-15", slot: "morning" };
const messageFor = (input) => {
  try {
    validateFields(input);
  } catch (err) {
    return err.message;
  }
  return null;
};

describe("validateFields", () => {
  test("accepts a valid reading and converts the value to a number", () => {
    expect(validateFields({ ...good, value: "120" })).toEqual(good);
  });

  test("value is required", () => {
    for (const value of [undefined, null, "", "  "]) {
      expect(messageFor({ ...good, value })).toBe(
        "Please enter a glucose value.",
      );
    }
  });

  test("value must be a whole number between 40 and 600", () => {
    const msg = "Value must be between 40 and 600 mg/dl.";
    for (const value of [39, 601, 100.5, "abc", -5]) {
      expect(messageFor({ ...good, value })).toBe(msg);
    }
    expect(messageFor({ ...good, value: 40 })).toBeNull(); // boundaries are allowed
    expect(messageFor({ ...good, value: 600 })).toBeNull();
  });

  test("date cannot be in the future", () => {
    expect(messageFor({ ...good, date: "2999-01-01" })).toBe(
      "Date cannot be in the future.",
    );
  });

  test("rejects an unknown slot", () => {
    expect(messageFor({ ...good, slot: "midnight" })).toBe(
      "Please choose a time slot.",
    );
  });
});
