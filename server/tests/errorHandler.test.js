const errorHandler = require("../src/middleware/errorHandler");
const { HttpError } = require("../src/utils/errors");

// No database needed: call the middleware directly with a fake response.
function run(err) {
  const res = {
    headersSent: false,
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  errorHandler(err, {}, res, () => {});
  return res;
}

beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => console.error.mockRestore());

describe("errorHandler", () => {
  test("shows our own messages for client errors", () => {
    const res = run(new HttpError("Please enter a glucose value.", 400));
    expect(res.code).toBe(400);
    expect(res.body.error).toBe("Please enter a glucose value.");
  });

  test("never leaks database errors", () => {
    const err = Object.assign(new Error('relation "users" does not exist'), {
      code: "42P01",
    });
    const res = run(err);
    expect(res.code).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/relation|users|42P01/);
  });

  test("never leaks the message of a 5xx error, even with a status set", () => {
    const res = run(
      Object.assign(new Error("secret path /srv/app"), { status: 500 }),
    );
    expect(res.code).toBe(500);
    expect(res.body.error).toBe("Something went wrong. Please try again.");
    expect(console.error).toHaveBeenCalled();
  });

  test("does not echo messages from library 4xx errors", () => {
    const res = run(
      Object.assign(new Error("internal detail"), { status: 415 }),
    );
    expect(res.code).toBe(415);
    expect(JSON.stringify(res.body)).not.toMatch(/internal detail/);
  });

  test("bad JSON gets a friendly message", () => {
    const res = run(
      Object.assign(new Error("Unexpected token"), {
        type: "entity.parse.failed",
        status: 400,
      }),
    );
    expect(res.code).toBe(400);
    expect(res.body.error).toBe("Request body must be valid JSON.");
  });
});
