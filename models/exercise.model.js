const db = require("../db/database");

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

function createExercise(userId, duration, description, date) {
  const exercise = db
    .prepare(
      "INSERT INTO exercises (userId, duration, description, date) VALUES (@userId, @duration, @description, @date)",
    )
    .run({ userId, duration, description, date });
  return exercise;
}

function getExercisesById(userId, from, to) {
  const exercises = db
    .prepare(
      `
    SELECT * FROM exercises
    WHERE userId = @userId
      AND (@from IS NULL OR date >= @from)
      AND (@to IS NULL OR date <= @to)
    ORDER BY date ASC
    `,
    )
    .all({ userId, from: from ?? null, to: to ?? null });
  return exercises;
}

module.exports = {
  createExercise,
  getExercisesById,
};
