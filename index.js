const express = require("express");
const database = require("better-sqlite3");
const app = express();
const cors = require("cors");

require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const db = new database("my-database.db");

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
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

function createExercise(userId, duration, description, date) {
  const exercise = db
    .prepare(
      "INSERT INTO exercises (userId, duration, description, date) VALUES (@userId, @duration, @description, @date)",
    )
    .run({ userId, duration, description, date });
  return exercise;
}

function getAllUsers() {
  const users = db.prepare("SELECT * FROM users").all();
  return users;
}

function getExercisesById(userId, from, to, limit) {
  const exercises = db
    .prepare(
      `
    SELECT * FROM exercises
    WHERE userId = @userId
      AND (@from IS NULL OR date >= @from)
      AND (@to IS NULL OR date <= @to)
    ORDER BY date DESC
    ${limit ? "LIMIT @limit" : ""}
    `,
    )
    .all({ userId, from: from ?? null, to: to ?? null, limit });
  return exercises;
}

function validatePositiveNumber(value, fieldName) {
  if (typeof Number(value) !== "number") {
    return { error: `Invalid ${fieldName}`, status: 400 };
  }
  if (value <= 0) {
    return { error: `${fieldName} must be a positive number`, status: 400 };
  }
  return { value };
}

function validateString(value, fieldName) {
  if (typeof value !== "string") {
    return { error: `Invalid ${fieldName}`, status: 400 };
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return { error: `${fieldName} cannot be empty`, status: 400 };
  }
  return { value: trimmed };
}

function validateDateFormat(date) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
}

app.post("/api/users", (req, res) => {
  const usernameValidation = validateString(req.body.username, "username");
  if (usernameValidation.error) {
    return res
      .status(usernameValidation.status)
      .json({ error: usernameValidation.error });
  }

  const username = usernameValidation.value;
  if (checkUserExists(username)) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const result = createUser(username);
  if (!result) {
    return res.status(500).json({ error: "Failed to create user" });
  }

  res.status(200).json({
    username,
    _id: result.lastInsertRowid.toString(),
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const durationValidation = validatePositiveNumber(
    req.body.duration,
    "duration",
  );
  if (durationValidation.error) {
    return res
      .status(durationValidation.status)
      .json({ error: durationValidation.error });
  }
  const descriptionValidation = validateString(
    req.body.description,
    "description",
  );
  if (descriptionValidation.error) {
    return res
      .status(descriptionValidation.status)
      .json({ error: descriptionValidation.error });
  }

  let date = req.body.date;
  if (!date) {
    date = new Date().toISOString().split("T")[0];
  } else if (!validateDateFormat(date)) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  const duration = durationValidation.value;
  const description = descriptionValidation.value;

  const exercise = createExercise(userId, duration, description, date);
  if (!exercise) {
    return res.status(500).json({ error: "Failed to create exercise" });
  }

  res.status(200).json({
    _id: userId,
    username: user.username,
    date: new Date(date).toDateString(),
    duration: duration,
    description: description,
  });
});

app.get("/api/users", (req, res) => {
  const users = getAllUsers();
  if (users.length === 0) {
    return res.status(404).json({ error: "No users found" });
  }
  res.status(200).json(users);
});

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const validateFrom = validateDateFormat(from) ? from : null;
  const validateTo = validateDateFormat(to) ? to : null;
  const validateLimit = validatePositiveNumber(limit, "limit")?.value
    ? limit
    : null;

  const exercises = getExercisesById(
    userId,
    validateFrom,
    validateTo,
    validateLimit,
  );

  return res.status(200).json({
    _id: userId,
    username: user.username,
    count: exercises.length,
    log: exercises.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      date: new Date(ex.date).toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
