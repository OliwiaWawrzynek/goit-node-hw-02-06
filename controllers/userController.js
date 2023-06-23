const { updateUser } = require("../service");
const User = require("./../service/models/userModel");

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

    if (!User.schema.path("subscription").enumValues.includes(subscription)) {
      return res.status(400).json({
        status: "fail",
        code: 400,
        message: "Wrong field subscription",
      });
    }

    const updatedUser = await updateUser(req.params.userId, { subscription });
    res.status(200).json({
      status: "success",
      code: 200,
      data: {
        user: {
          email: updatedUser.email,
          subscription: updatedUser.subscription,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCurrentUser, updateSubscription };
