const database = require("better-sqlite3");

const db = new database("my-database.db");

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

module.exports = db;
