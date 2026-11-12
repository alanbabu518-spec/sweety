const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const config = require('../config');
const requireAuth = require('../middleware/auth');
const { HttpError, asyncHandler } = require('../utils/errors');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (userId) =>
  jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

router.post('/register', asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name) throw new HttpError('Please enter your name.');
  if (!EMAIL_RE.test(email)) throw new HttpError('Please enter a valid email address.');
  if (password.length < 8) throw new HttpError('Password must be at least 8 characters.');

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash]
    );
    res.status(201).json({ user: publicUser(rows[0]), token: signToken(rows[0].id) });
  } catch (err) {
    if (err.code === '23505') throw new HttpError('An account with this email already exists.', 409);
    throw err;
  }
}));

router.post('/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  // Same message for unknown email and wrong password, so we don't leak which exists.
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError('Invalid email or password.', 401);

  res.json({ user: publicUser(user), token: signToken(user.id) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) throw new HttpError('User not found.', 404);
  res.json({ user: rows[0] });
}));

module.exports = router;