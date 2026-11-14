const { rateLimit } = require("express-rate-limit");
const config = require("../config");

const options = {
  windowMs: config.rateLimit.windowMs,
  standardHeaders: "draft-7", // sends RateLimit headers (and Retry-After when blocked)
  legacyHeaders: false,
  // A request counts as "successful" only for 2xx/3xx. Used by skipSuccessfulRequests below.
  requestWasSuccessful: (req, res) => res.statusCode < 400,
  message: { error: "Too many attempts. Please try again in a few minutes." },
};

// Login: only FAILED attempts count, so normal users are never locked out,
// but guessing passwords stops after a few tries.
const loginLimiter = rateLimit({
  ...options,
  limit: config.rateLimit.loginMax,
  skipSuccessfulRequests: true,
});

// Register: every request counts, which slows down mass account creation.
const registerLimiter = rateLimit({
  ...options,
  limit: config.rateLimit.registerMax,
});

module.exports = { loginLimiter, registerLimiter };
