const userModel = require("../models/user.model");
const exerciseModel = require("../models/exercise.model");
const {
  validatePositiveNumber,
  validateString,
  validateDateFormat,
} = require("../utils/validation");

exports.postExercise = (req, res) => {
  const userId = req.params._id;
  const user = userModel.getUserById(userId);
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

  const exercise = exerciseModel.createExercise(
    userId,
    duration,
    description,
    date,
  );
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
};

exports.getLogs = (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = userModel.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const validateFrom = validateDateFormat(from) ? from : null;
  const validateTo = validateDateFormat(to) ? to : null;
  const validatedLimit = validatePositiveNumber(limit, "limit")?.value
    ? limit
    : null;

  const exercises = exerciseModel.getExercisesById(
    userId,
    validateFrom,
    validateTo,
  );
  if (exercises.length === 0) {
    return res.status(404).json({ error: "No exercises found" });
  }

  const exercisesToSend = validatedLimit
    ? exercises.slice(0, validatedLimit)
    : exercises;

  return res.status(200).json({
    _id: userId,
    username: user.username,
    count: exercises.length,
    log: exercisesToSend.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      date: new Date(ex.date).toDateString(),
    })),
  });
};
