const User = require("./../service/models/userModel");
const multer = require("multer");
const gravatar = require("gravatar");
const Jimp = require("jimp");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "tmp");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image!!!"), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const uploadAvatar = upload.single("avatar");

const getCurrentUser = async (req, res, next) => {
  try {
    const currentUser = req.user;
    res.status(200).json({
      status: "success",
      code: 200,
      data: {
        user: {
          email: currentUser.email,
          subscription: currentUser.subscription,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateSubscription = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        code: 401,
        message: "Not authorized",
      });
    }

    if (!User.schema.path("subscription").enumValues.includes(subscription)) {
      return res.status(400).json({
        status: "fail",
        code: 400,
        message: "Wrong field subscription",
      });
    }

    currentUser.subscription = subscription;
    await currentUser.save();

    res.status(200).json({
      status: "success",
      code: 200,
      data: {
        user: {
          _id: currentUser._id,
          subscription: currentUser.subscription,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const generateProfilePhoto = (email, options, protocol) => {
  return gravatar.url(email, options, protocol);
};

const createAvatar = async (path, res, filename) => {
  try {
    const response = await Jimp.read(path);
    return response
      .resize(250, 250)
      .quality(60)
      .write(`public/avatars/${filename}`);
  } catch (error) {
    res.status(404).json({
      status: "fail",
      code: 404,
      message: error,
    });
  }
};

const updateAvatar = async (req, res, next) => {
  const currentUser = req.user;
  try {
    await createAvatar(req.file.path, res, req.file.filename);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        code: 401,
        message: "Not authorized",
      });
    }

    currentUser.avatarURL = `public/avatars/${req.file.filename}`;
    await currentUser.save();

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Avatar updated",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateSubscription,
  generateProfilePhoto,
  updateAvatar,
  uploadAvatar,
};
