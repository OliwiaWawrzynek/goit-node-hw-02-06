const express = require("express");
const {
  signup,
  login,
  logout,
  protect,
} = require("./../controllers/authController");
const {
  getCurrentUser,
  updateSubscription,
} = require("./../controllers/userController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", protect, logout);
router.get("/current", protect, getCurrentUser);
router.patch("/:userId", protect, updateSubscription);

module.exports = router;
