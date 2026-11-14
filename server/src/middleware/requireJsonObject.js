const { HttpError } = require("../utils/errors");
const { isPlainObject } = require("../utils/validate");

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

// Every route that reads req.body expects a JSON object like { "email": "..." }.
// Reject arrays (and anything else) up front so the routes can rely on the shape.
module.exports = function requireJsonObject(req, res, next) {
  if (METHODS_WITH_BODY.has(req.method) && !isPlainObject(req.body)) {
    return next(new HttpError("Request body must be a JSON object."));
  }
  next();
};
