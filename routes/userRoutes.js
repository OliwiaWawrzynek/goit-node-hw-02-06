const express = require("express");
const {
  signup,
  login,
  logout,
  protect,
  verifyEmail,
  resendVerificationEmail,
} = require("./../controllers/authController");
const {
  getCurrentUser,
  updateSubscription,
  updateAvatar,
  uploadAvatar,
} = require("./../controllers/userController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify/:verificationToken", verifyEmail);
router.post("/verify", resendVerificationEmail);
router.get("/logout", protect, logout);
router.get("/current", protect, getCurrentUser);
router.patch("/", protect, updateSubscription);
router.patch("/public/avatars", protect, uploadAvatar, updateAvatar);

module.exports = router;
