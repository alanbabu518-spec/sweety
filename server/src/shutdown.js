// Builds a shutdown function: stop taking new requests, let running ones finish,
// close the database pool, then exit. Dependencies are passed in so it is easy to test.
function createShutdown({
  server,
  pool,
  timeoutMs = 10000,
  log = console,
  exit = process.exit,
}) {
  let started = false;

  return async function shutdown(signal) {
    if (started) return; // a second Ctrl+C while we are closing is ignored
    started = true;
    log.log(`${signal} received. Shutting down...`);

    // Safety net: if something hangs, force the exit instead of waiting forever.
    const timer = setTimeout(() => {
      log.error("Shutdown timed out. Forcing exit.");
      exit(1);
    }, timeoutMs);
    timer.unref();

    try {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve())); // waits for in-flight requests
        server.closeIdleConnections?.(); // drop idle keep-alive sockets so close() can finish
      });
      await pool.end(); // only after the server is closed, so running queries can finish
      log.log("Shutdown complete.");
      clearTimeout(timer);
      exit(0);
    } catch (err) {
      log.error("Error during shutdown:", err.message);
      clearTimeout(timer);
      exit(1);
    }
  };
}

module.exports = { createShutdown };
