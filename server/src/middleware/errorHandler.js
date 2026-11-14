// Friendly messages for errors thrown by express.json() before our routes run.
const BODY_PARSER_MESSAGES = {
  "entity.parse.failed": "Request body must be valid JSON.",
  "entity.too.large": "Request body is too large.",
};

module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const friendly = BODY_PARSER_MESSAGES[err.type];
  if (friendly) return res.status(err.status || 400).json({ error: friendly });

  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
};
