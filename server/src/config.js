require("dotenv").config();
const { isValidTimeZone } = require("./utils/dates");

// Values that must never be used as a real JWT secret in production.
const PLACEHOLDER_SECRETS = [
  "change-me-to-a-long-random-string",
  "dev-only-secret",
  "secret",
  "changeme",
];

// Reads an optional whole-number setting. Invalid values are recorded in `errors`.
function readInt(env, name, fallback, min, max, errors) {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    errors.push(`${name} must be a whole number between ${min} and ${max}.`);
    return fallback;
  }
  return n;
}

// Validates the environment once, at startup, and reports every problem together.
function loadConfig(env = process.env) {
  const errors = [];
  const nodeEnv = env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  if (!env.DATABASE_URL) errors.push("DATABASE_URL is required.");

  let jwtSecret = env.JWT_SECRET;
  if (isProduction) {
    if (!jwtSecret) {
      errors.push("JWT_SECRET is required in production.");
    } else if (
      jwtSecret.length < 32 ||
      PLACEHOLDER_SECRETS.includes(jwtSecret)
    ) {
      errors.push(
        "JWT_SECRET must be a random string of at least 32 characters in production (not the example value).",
      );
    }
  } else if (!jwtSecret) {
    jwtSecret = "dev-only-secret"; // convenience for local development only
    if (nodeEnv !== "test")
      console.warn(
        "Warning: JWT_SECRET is not set. Using an insecure development secret.",
      );
  }

  let clientOrigin = env.CLIENT_ORIGIN;
  if (!clientOrigin) {
    if (isProduction) errors.push("CLIENT_ORIGIN is required in production.");
    clientOrigin = "http://localhost:5173";
  } else {
    try {
      new URL(clientOrigin);
    } catch {
      errors.push(
        "CLIENT_ORIGIN must be a valid URL, for example https://app.example.com.",
      );
    }
  }

  const appTimezone = env.APP_TIMEZONE || "UTC";
  if (!isValidTimeZone(appTimezone)) {
    errors.push(
      `APP_TIMEZONE "${appTimezone}" is not a valid IANA time zone (for example UTC or Asia/Kolkata).`,
    );
  }

  const config = {
    nodeEnv,
    isProduction,
    port: readInt(env, "PORT", 4000, 0, 65535, errors),
    databaseUrl: env.DATABASE_URL,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || "7d",
    clientOrigin,
    appTimezone, // used when the browser does not send its own time zone
    trustProxy: readInt(env, "TRUST_PROXY", 0, 0, 10, errors), // number of reverse proxies in front of the API
    rateLimit: {
      windowMs:
        readInt(env, "RATE_LIMIT_WINDOW_MINUTES", 15, 1, 1440, errors) *
        60 *
        1000,
      loginMax: readInt(env, "LOGIN_RATE_LIMIT_MAX", 10, 1, 100000, errors),
      registerMax: readInt(
        env,
        "REGISTER_RATE_LIMIT_MAX",
        10,
        1,
        100000,
        errors,
      ),
    },
  };

  if (errors.length) {
    throw new Error(
      `Invalid environment configuration:\n - ${errors.join("\n - ")}`,
    );
  }
  return config;
}

module.exports = loadConfig();
module.exports.loadConfig = loadConfig; // exported so tests can try different environments
