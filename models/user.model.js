const db = require("../db/database");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL
  )
`,
).run();

function getUserById(id) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return user;
}

function checkUserExists(username) {
  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);
  return user ? true : false;
}

function createUser(username) {
  const user = db
    .prepare("INSERT INTO users (username) VALUES (?)")
    .run(username);
  return user;
}

function getAllUsers() {
  const users = db.prepare("SELECT * FROM users").all();
  return users;
}

module.exports = {
  getUserById,
  checkUserExists,
  createUser,
  getAllUsers,
};
