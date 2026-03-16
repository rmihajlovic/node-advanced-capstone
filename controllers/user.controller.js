const userModel = require("../models/user.model");
const { validateString } = require("../utils/validation");

exports.postUser = (req, res) => {
  const usernameValidation = validateString(req.body.username, "username");
  if (usernameValidation.error) {
    return res
      .status(usernameValidation.status)
      .json({ error: usernameValidation.error });
  }

  const username = usernameValidation.value;
  if (userModel.checkUserExists(username)) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const result = userModel.createUser(username);
  if (!result) {
    return res.status(500).json({ error: "Failed to create user" });
  }

  res.status(200).json({
    username,
    _id: result.lastInsertRowid.toString(),
  });
};

exports.getUsers = (req, res) => {
  const users = userModel.getAllUsers();
  if (users.length === 0) {
    return res.status(404).json({ error: "No users found" });
  }
  res.status(200).json(users);
};
