const User = require("./../service/models/userModel");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { generateProfilePhoto } = require("./userController");
const validator = require("validator");
const sgMail = require("@sendgrid/mail");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const generateVerificationToken = () => {
  return randomUUID();
};

const signup = async (req, res, next) => {
  const { email, password } = req.body;
  const verificationToken = generateVerificationToken();
  const verificationLink = `${req.protocol}://${req.get(
    "host"
  )}/api/users/verify/${verificationToken}`;
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
    await sendVerificationEmail(verificationLink, email);

    const newUser = await User.create({
      email,
      password,
      verificationToken: verificationToken,
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

    if (
      !user ||
      !(await user.correctPassword(password, user.password)) ||
      user.verify === false
    ) {
      return res.status(401).json({
        status: "fail",
        code: 401,
        message:
          "Your email, password is wrong or you didn't verify your email",
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

const verifyEmail = async (req, res, next) => {
  const { verificationToken } = req.params;
  try {
    const user = await User.findOne({ verificationToken: verificationToken });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        code: 404,
        message: "User not found",
      });
    }

    user.verificationToken = "null";
    user.verify = true;
    await user.save();

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Verification successful",
    });
  } catch (error) {
    next(error);
  }
};

const sendVerificationEmail = async (verificationLink, email) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: email,
    from: process.env.MY_EMAIL,
    subject: `Verify you email`,
    html: `<p>To verify your email, please click the link: <a href="${verificationLink}">${verificationLink}</a></p>`,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    throw new Error(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        status: "fail",
        code: 400,
        message: "Please provide a valid email address",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        code: 404,
        message: "User not found",
      });
    }

    if (user.verify) {
      return res.status(400).json({
        status: "fail",
        code: 400,
        message: "Verification has already been passed",
      });
    }

    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/api/users/verify/${user.verificationToken}`;

    await sendVerificationEmail(verificationLink, email);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Verification email resent",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  protect,
  logout,
  verifyEmail,
  sendVerificationEmail,
  resendVerificationEmail,
};
