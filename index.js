const express = require("express");
const userController = require("./controllers/user.controller");
const exerciseController = require("./controllers/exercise.controller");
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

app.post("/api/users", userController.postUser);
app.get("/api/users", userController.getUsers);

app.post("/api/users/:_id/exercises", exerciseController.postExercise);
app.get("/api/users/:_id/logs", exerciseController.getLogs);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
