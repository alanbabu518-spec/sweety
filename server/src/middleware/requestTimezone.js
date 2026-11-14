const config = require("../config");
const { isValidTimeZone } = require("../utils/dates");

// The browser sends its IANA time zone in the X-Timezone header (e.g. "Asia/Kolkata").
// An unknown or invalid value is ignored and the server default (APP_TIMEZONE) is used.
module.exports = function requestTimezone(req, res, next) {
  const sent = req.get("X-Timezone");
  req.timezone =
    sent && sent.length <= 64 && isValidTimeZone(sent)
      ? sent
      : config.appTimezone;
  next();
};
