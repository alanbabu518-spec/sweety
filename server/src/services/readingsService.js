const pool = require('../db/pool');
const { HttpError } = require('../utils/errors');
const { todayString, isValidDateString } = require('../utils/dates');

const SLOTS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};
const MAX_PER_DAY = 4;

const toReading = (r) => ({
  id: r.id,
  date: r.reading_date,
  slot: r.slot,
  slotLabel: SLOTS[r.slot],
  value: r.value,
});

const article = (label) => (/^[aeiou]/i.test(label) ? 'an' : 'a');

const duplicateMessage = (slot) => {
  const label = SLOTS[slot];
  return `You already have ${article(label)} ${label} reading for this date.`;
};

// Checks the shape of the input only. Returns cleaned values or throws HttpError.
function validateFields({ value, date, slot }) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new HttpError('Please enter a glucose value.');
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 40 || num > 600) {
    throw new HttpError('Value must be between 40 and 600 mg/dl.');
  }
  if (!isValidDateString(date)) {
    throw new HttpError('Please choose a valid date.');
  }
  if (date > todayString()) {
    throw new HttpError('Date cannot be in the future.');
  }
  if (!Object.prototype.hasOwnProperty.call(SLOTS, slot)) {
    throw new HttpError('Please choose a time slot.');
  }
  return { value: num, date, slot };
}

// Checks rules that need the database. excludeId lets an edit ignore itself.
// The 4-per-day check runs first: once a day has 4 readings every slot is taken,
// so "maximum 4" is a more helpful message than "slot already used".
async function assertSlotAvailable(userId, { date, slot }, excludeId = null) {
  const { rows } = await pool.query(
    `SELECT slot FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)`,
    [userId, date, excludeId]
  );
  if (rows.length >= MAX_PER_DAY) {
    throw new HttpError('You can add only 4 readings per day.', 409);
  }
  if (rows.some((r) => r.slot === slot)) {
    throw new HttpError(duplicateMessage(slot), 409);
  }
}

// Unique-constraint violation (two requests racing) -> same friendly message.
function rethrowDuplicate(err, slot) {
  if (err.code === '23505') throw new HttpError(duplicateMessage(slot), 409);
  throw err;
}

async function listReadings(userId, { date } = {}) {
  if (date !== undefined && !isValidDateString(date)) {
    throw new HttpError('Please choose a valid date.');
  }
  const params = [userId];
  let where = 'user_id = $1';
  if (date) {
    params.push(date);
    where += ' AND reading_date = $2';
  }
  const { rows } = await pool.query(
    `SELECT * FROM readings WHERE ${where}
     ORDER BY reading_date DESC,
       array_position(ARRAY['morning','after_breakfast','after_lunch','after_dinner'], slot)`,
    params
  );
  return rows.map(toReading);
}

async function createReading(userId, input) {
  const data = validateFields(input);
  await assertSlotAvailable(userId, data);
  try {
    const { rows } = await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, data.date, data.slot, data.value]
    );
    return toReading(rows[0]);
  } catch (err) {
    return rethrowDuplicate(err, data.slot);
  }
}

async function updateReading(userId, id, input) {
  const existing = await pool.query(
    'SELECT * FROM readings WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!existing.rows[0]) throw new HttpError('Reading not found.', 404);

  const current = existing.rows[0];
  // Fields not sent keep their current value.
  const data = validateFields({
    value: input.value !== undefined ? input.value : current.value,
    date: input.date !== undefined ? input.date : current.reading_date,
    slot: input.slot !== undefined ? input.slot : current.slot,
  });
  await assertSlotAvailable(userId, data, current.id);
  try {
    const { rows } = await pool.query(
      `UPDATE readings
       SET reading_date = $1, slot = $2, value = $3, updated_at = now()
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [data.date, data.slot, data.value, id, userId]
    );
    return toReading(rows[0]);
  } catch (err) {
    return rethrowDuplicate(err, data.slot);
  }
}

async function deleteReading(userId, id) {
  const { rowCount } = await pool.query(
    'DELETE FROM readings WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!rowCount) throw new HttpError('Reading not found.', 404);
}

module.exports = {
  SLOTS,
  validateFields,
  listReadings,
  createReading,
  updateReading,
  deleteReading,
};