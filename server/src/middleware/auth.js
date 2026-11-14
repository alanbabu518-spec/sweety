const jwt = require("jsonwebtoken");
const config = require("../config");
const { HttpError } = require("../utils/errors");

// Errors that simply mean "this token is no good" (expired, forged, malformed...).
// Anything else is a real server problem and must not be reported as a bad login.
const TOKEN_ERRORS = new Set([
  "JsonWebTokenError",
  "TokenExpiredError",
  "NotBeforeError",
]);

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");

  // Exactly: "Bearer <token>"
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return next(new HttpError("Please log in to continue.", 401));
  }

  try {
    const payload = jwt.verify(parts[1], config.jwtSecret, {
      algorithms: ["HS256"], // refuse "none" and any other algorithm
    });

    // We always sign { sub: <numeric user id> }. Anything else is not our token.
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id < 1) {
      return next(
        new HttpError("Your session has expired. Please log in again.", 401),
      );
    }

    req.user = { id };
    next();
  } catch (err) {
    if (TOKEN_ERRORS.has(err.name)) {
      return next(
        new HttpError("Your session has expired. Please log in again.", 401),
      );
    }
    next(err);
  }
};
