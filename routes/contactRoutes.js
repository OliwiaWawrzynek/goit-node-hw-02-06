const express = require("express");
const contactController = require("../controllers/contactController");
const router = express.Router();
const { protect } = require("./../controllers/authController");

router.param("contactId", protect);
router.param("contactId", contactController.checkID);

router
  .route("/")
  .get(protect, contactController.get)
  .post(protect, contactController.create);

router
  .route("/:contactId")
  .get(contactController.getById)
  .put(contactController.update)
  .delete(contactController.remove);

router.route("/:contactId/favorite").patch(contactController.updateStatus);

module.exports = router;
