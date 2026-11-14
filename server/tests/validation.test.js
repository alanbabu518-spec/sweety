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

describe("validateFields: unusual input types", () => {
  test.each([
    ["an array", [100]],
    ["an object", { n: 100 }],
    ["a boolean", true],
    ["scientific notation", "1e2"],
    ["a hex string", "0x64"],
    ["a decimal string", "100.5"],
    ["zero", 0],
  ])("a glucose value given as %s is rejected", (label, value) => {
    expect(messageFor({ ...good, value })).toBe(
      "Value must be between 40 and 600 mg/dl.",
    );
  });

  test("a numeric string with spaces is accepted (what a form can send)", () => {
    expect(validateFields({ ...good, value: " 110 " }).value).toBe(110);
  });

  test.each([
    ["an array", ["morning"]],
    ["an object", { a: 1 }],
    ["a number", 1],
    ["missing", undefined],
    ["toString", "toString"],
    ["__proto__", "__proto__"],
  ])("a slot given as %s is rejected", (label, slot) => {
    expect(messageFor({ ...good, slot })).toBe("Please choose a time slot.");
  });

  test.each([
    ["a number", 20261015],
    ["an array", ["2026-10-15"]],
    ["a fake date", "2026-02-30"],
    ["wrong format", "15-10-2026"],
    ["missing", undefined],
  ])("a date given as %s is rejected", (label, date) => {
    expect(messageFor({ ...good, date })).toBe("Please choose a valid date.");
  });
});

describe("validateFields: 'today' comes from the caller (the user's time zone)", () => {
  test("tomorrow is in the future, today is allowed", () => {
    const input = { ...good, date: "2026-11-14" };
    expect(() => validateFields(input, "2026-11-13")).toThrow(
      "Date cannot be in the future.",
    );
    expect(validateFields(input, "2026-11-14").date).toBe("2026-11-14");
  });
});
