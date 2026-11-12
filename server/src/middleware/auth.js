const jwt = require('jsonwebtoken');
const config = require('../config');
const { HttpError } = require('../utils/errors');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError('Please log in to continue.', 401));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub };
    next();
  } catch {
    next(new HttpError('Your session has expired. Please log in again.', 401));
  }
};