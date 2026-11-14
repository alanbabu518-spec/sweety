let config;
try {
  config = require("./config"); // validates the environment before anything else starts
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const app = require("./app");
const pool = require("./db/pool");
const { createShutdown } = require("./shutdown");

const server = app.listen(config.port, () => {
  console.log(
    `Sweety API running on http://localhost:${server.address().port}`,
  );
});

const shutdown = createShutdown({ server, pool });
process.on("SIGTERM", () => shutdown("SIGTERM")); // sent by Docker / hosting platforms
process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C
