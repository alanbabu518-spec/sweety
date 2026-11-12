const { Pool, types } = require('pg');
const config = require('../config');

// Return DATE columns as plain 'YYYY-MM-DD' strings (no timezone shifting).
types.setTypeParser(1082, (value) => value);

module.exports = new Pool({ connectionString: config.databaseUrl });