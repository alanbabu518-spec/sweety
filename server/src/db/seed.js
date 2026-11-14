const bcrypt = require("bcrypt");
const pool = require("./pool");
const config = require("../config");
const migrate = require("./migrate");
const { todayString } = require("../utils/dates");

const DEMO_USER = {
  name: "Sweety Demo",
  email: "demo@sweety.local",
  password: "SweetyDemo123!",
};

function dateDaysAgo(days) {
  const today = todayString(config.appTimezone);
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - days));
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

async function seed() {
  await migrate();
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [DEMO_USER.name, DEMO_USER.email, passwordHash],
    );

    const userId = rows[0].id;
    // Re-running the seed refreshes only this demo user's sample readings.
    await client.query("DELETE FROM readings WHERE user_id = $1", [userId]);

    const sampleReadings = [
      [dateDaysAgo(2), "morning", 108],
      [dateDaysAgo(2), "after_breakfast", 142],
      [dateDaysAgo(2), "after_lunch", 136],
      [dateDaysAgo(2), "after_dinner", 128],
      [dateDaysAgo(1), "morning", 104],
      [dateDaysAgo(1), "after_breakfast", 138],
      [dateDaysAgo(1), "after_lunch", 132],
      [dateDaysAgo(1), "after_dinner", 125],
      [dateDaysAgo(0), "morning", 102],
      [dateDaysAgo(0), "after_breakfast", 135],
      [dateDaysAgo(0), "after_lunch", 130],
    ];

    for (const [date, slot, value] of sampleReadings) {
      await client.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)`,
        [userId, date, slot, value],
      );
    }

    await client.query("COMMIT");
    console.log("Demo user and sample readings created.");
    console.log(`Email: ${DEMO_USER.email}`);
    console.log(`Password: ${DEMO_USER.password}`);
    console.log(
      "The seed can be run again safely; demo readings are refreshed.",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await pool.end();
  process.exitCode = 1;
});
