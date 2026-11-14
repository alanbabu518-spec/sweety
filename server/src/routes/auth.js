const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const config = require("../config");
const requireAuth = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimit");
const { cleanText } = require("../utils/validate");
const { HttpError, asyncHandler } = require("../utils/errors");

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MAX = 100; // matches users.name VARCHAR(100)
const EMAIL_MAX = 255; // matches users.email VARCHAR(255)
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores everything after 72 bytes

const signToken = (userId) =>
  jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

router.post(
  "/register",
  registerLimiter,
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name);
    const email = cleanText(req.body.email).toLowerCase();
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!name) throw new HttpError("Please enter your name.");
    if (name.length > NAME_MAX)
      throw new HttpError(`Name must be ${NAME_MAX} characters or fewer.`);
    if (!EMAIL_RE.test(email) || email.length > EMAIL_MAX)
      throw new HttpError("Please enter a valid email address.");
    if (password.length < PASSWORD_MIN)
      throw new HttpError("Password must be at least 8 characters.");
    if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES)
      throw new HttpError(
        "Password is too long. Please use 72 characters or fewer.",
      );

    // ...const passwordHash = await bcrypt.hash(password, 10); continues as before

    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, name, email`,
        [name, email, passwordHash],
      );
      res
        .status(201)
        .json({ user: publicUser(rows[0]), token: signToken(rows[0].id) });
    } catch (err) {
      if (err.code === "23505")
        throw new HttpError("An account with this email already exists.", 409);
      throw err;
    }
  }),
);

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = cleanText(req.body.email).toLowerCase();
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      throw new HttpError("Please enter your email and password.");
    }

    // bcrypt only considers the first 72 bytes.
    if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
      throw new HttpError("Invalid email or password.", 401);
    }

    // 1. Find the user by email.
    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    const user = rows[0];

    // 2. Check whether the user exists and the password matches.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new HttpError("Invalid email or password.", 401);
    }

    // 3. Return public user details and JWT.
    res.json({
      user: publicUser(user),
      token: signToken(user.id),
    });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.user.id],
    );
    if (!rows[0]) throw new HttpError("User not found.", 404);
    res.json({ user: rows[0] });
  }),
);

module.exports = router;
