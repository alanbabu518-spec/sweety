CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE readings (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot         VARCHAR(20) NOT NULL
               CHECK (slot IN ('morning','after_breakfast','after_lunch','after_dinner')),
  value        INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- safety net: the app also checks this and returns a friendly message
  CONSTRAINT one_reading_per_slot_per_day UNIQUE (user_id, reading_date, slot)
);

CREATE INDEX idx_readings_user_date ON readings (user_id, reading_date);