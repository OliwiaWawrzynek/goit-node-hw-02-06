const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 8,
    validate: [
      validator.isStrongPassword,
      "The password must be at least 8 characters and contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol.",
    ],
    select: false,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  subscription: {
    type: String,
    enum: {
      values: ["starter", "pro", "business"],
      message: "Wrong field subscription",
    },
    default: "starter",
  },
  token: {
    type: String,
    default: null,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
