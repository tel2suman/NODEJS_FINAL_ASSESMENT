const express = require("express");

const UserController = require("../controllers/UserController");

const authCheck = require("../middleware/authCheck");

const Rolechek = require("../middleware/roleCheck");

const Upload = require("../utils/CloudinaryImageUpload");

const router = express.Router();

router.post(
  "/register-user",
  Upload.single("image"),
  UserController.registerUser,
);

router.post("/verify-user", UserController.verifyUser);

router.post("/login-user", UserController.loginUser);

router.use(authCheck);

router.get("/user-profile/:id", UserController.getUserProfile);

router.put(
  "/update-profile/:id",
  Upload.single("image"),
  UserController.updateUser,
);


module.exports = router;