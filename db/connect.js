const sqlite = require('sqlite');
const DATABASE_URL = process.env.DATABASE_URL || '.data/database.sqlite';

const dbPromise = sqlite.open(DATABASE_URL, { Promise });

module.exports = {
  dbPromise
};