const Contact = require("./models/contactModel");
const User = require("./models/userModel");

const listContacts = (user, query) => {
  return Contact.find({ owner: user, ...query });
};

const getContactById = (id, user) => {
  return Contact.findOne({ _id: id, owner: user });
};

const removeContact = (id, user) => {
  return Contact.findOneAndRemove({ _id: id, owner: user });
};

const createContact = (body, user) => {
  return Contact.create({ ...body, owner: user });
};

const updateContact = (id, body, user) => {
  return Contact.findOneAndUpdate({ _id: id, owner: user }, body, {
    new: true,
    runValidators: true,
  });
};

const updateUser = (id, body) => {
  return User.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  createContact,
  updateContact,
  updateUser,
};
