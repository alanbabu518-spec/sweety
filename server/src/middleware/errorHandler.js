const { HttpError } = require("../utils/errors");

// Friendly messages for errors thrown by express.json() before our routes run.
const BODY_PARSER_MESSAGES = {
  "entity.parse.failed": "Request body must be valid JSON.",
  "entity.too.large": "Request body is too large.",
};

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status =
    Number.isInteger(err?.status) && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  // Body-parser problems (bad JSON, body too large).
  const friendly = BODY_PARSER_MESSAGES[err?.type];
  if (friendly) return res.status(status).json({ error: friendly });

  // Messages we wrote ourselves for the user (validation, "not found", 401...).
  // Server-side failures (5xx) are never sent to the client, even from HttpError.
  if (err instanceof HttpError && status < 500) {
    return res.status(status).json({ error: err.message });
  }

  // Everything else (database errors, bugs, library errors) is logged on the
  // server only. The response never includes the message, stack or SQL details.
  console.error(err);
  res.status(status < 500 ? status : 500).json({
    error: status < 500 ? "Request could not be processed." : GENERIC_MESSAGE,
  });
};
