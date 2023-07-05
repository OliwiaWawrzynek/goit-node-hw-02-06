const {
  listContacts,
  getContactById,
  createContact,
  removeContact,
  updateContact,
} = require("../service");

const checkID = async (req, res, next, val) => {
  try {
    const contacts = await listContacts(req.user._id);
    console.log(contacts.find((contact) => contact.id === val));
    if (!contacts.find((contact) => contact.id === val)) {
      return res.status(404).json({
        status: "fail",
        code: 404,
        message: `Not found contact id: ${val}`,
        data: null,
      });
    }
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const get = async (req, res, next) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let query = listContacts(req.user._id, queryObj);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = limit * (page - 1);
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const contactsQuantity = await Contact.countDocuments();

      if (skip >= contactsQuantity) {
        throw new Error("This page does not exist");
      }
    }

    const contacts = await query;
    res.status(200).json({
      status: "success",
      code: 200,
      data: { contacts },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const contact = await getContactById(req.params.contactId, req.user._id);
    res.status(200).json({
      status: "success",
      code: 200,
      data: { contact },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const newContact = await createContact(req.body, req.user._id);
    res.status(201).json({
      status: "success",
      code: 201,
      data: { contact: newContact },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await removeContact(req.params.contactId, req.user._id);
    res.status(200).json({
      status: "success",
      code: 200,
      message: "contact deleted",
      data: null,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        status: "fail",
        code: 400,
        message: "missing fields",
        data: null,
      });
    }
    const updatedContact = await updateContact(
      req.params.contactId,
      req.body,
      req.user._id
    );
    res.status(200).json({
      status: "success",
      code: 200,
      data: { contact: updatedContact },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { favorite } = req.body;

    if (favorite == null || favorite === "") {
      return res.status(400).json({
        status: "fail",
        code: 400,
        message: "missing field favorite",
      });
    }

    const updatedContact = await updateContact(
      req.params.contactId,
      {
        favorite,
      },
      req.user._id
    );
    res.status(200).json({
      status: "success",
      code: 200,
      data: { contact: updatedContact },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  checkID,
  updateStatus,
  get,
  getById,
  create,
  update,
  remove,
};
