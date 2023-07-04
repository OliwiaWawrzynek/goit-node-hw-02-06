const User = require("./../service/models/userModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { generateProfilePhoto } = require("./userController");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signup = async (req, res, next) => {
  const { email, password } = req.body;
  const profilePhoto = generateProfilePhoto(
    email,
    {
      s: "250",
      d: "retro",
      f: "y",
    },
    false
  );
  const user = await User.findOne({ email });

  if (user) {
    return res.status(409).json({
      status: "fail",
      code: 409,
      message: "Email is already in use",
    });
  }
  try {
    const newUser = await User.create({
      email,
      password,
      avatarURL: profilePhoto,
    });
    res.status(201).json({
      status: "success",
      code: 201,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        code: 400,
        message: "Please provide an email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        code: 401,
        message: "Email or password is wrong",
      });
    }

    const token = signToken(user._id);
    user.token = token;
    await user.save();
    res.status(200).json({
      status: "success",
      code: 200,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const currentUser = req.user;
    currentUser.token = null;
    await currentUser.save();
    res.status(204).json({
      status: "success",
      code: 204,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const protect = async (req, res, next) => {
  let token;
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        code: 401,
        message: "Not authorized",
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser || currentUser.token !== token) {
      return res.status(401).json({
        status: "fail",
        code: 401,
        message: "Not authorized",
      });
    }

    req.user = currentUser;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, protect, logout };
