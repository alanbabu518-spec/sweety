const { createShutdown } = require("../src/shutdown");

const log = { log: jest.fn(), error: jest.fn() };

// Fake server and pool that record the order in which they are closed.
function fakes({ serverError = null, poolError = null } = {}) {
  const calls = [];
  const server = {
    close: jest.fn((callback) => {
      calls.push("server.close");
      setImmediate(() => callback(serverError));
    }),
    closeIdleConnections: jest.fn(),
  };
  const pool = {
    end: jest.fn(async () => {
      calls.push("pool.end");
      if (poolError) throw poolError;
    }),
  };
  return { server, pool, exit: jest.fn(), calls };
}

describe("graceful shutdown", () => {
  test("closes the server first, then the pool, then exits with 0", async () => {
    const { server, pool, exit, calls } = fakes();
    await createShutdown({ server, pool, log, exit })("SIGTERM");

    expect(calls).toEqual(["server.close", "pool.end"]);
    expect(server.closeIdleConnections).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  test("exits with 1 if the server cannot be closed", async () => {
    const { server, pool, exit } = fakes({
      serverError: new Error("not running"),
    });
    await createShutdown({ server, pool, log, exit })("SIGINT");

    expect(pool.end).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });

  test("exits with 1 if the pool cannot be closed", async () => {
    const { server, pool, exit } = fakes({
      poolError: new Error("pool failed"),
    });
    await createShutdown({ server, pool, log, exit })("SIGTERM");

    expect(exit).toHaveBeenCalledWith(1);
  });

  test("ignores a second signal while already shutting down", async () => {
    const { server, pool, exit } = fakes();
    const shutdown = createShutdown({ server, pool, log, exit });
    await Promise.all([shutdown("SIGINT"), shutdown("SIGTERM")]);

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(pool.end).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  test("forces the exit if shutdown hangs", async () => {
    const { pool, exit } = fakes();
    const server = { close: jest.fn(), closeIdleConnections: jest.fn() }; // never calls back
    createShutdown({ server, pool, log, exit, timeoutMs: 20 })("SIGTERM"); // not awaited: it hangs

    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(exit).toHaveBeenCalledWith(1);
  });
});
