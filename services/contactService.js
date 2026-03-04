const ContactModel = require("../models/contactUsModel");

const subjectPriorityMap = {
  "Emergency Request": "urgent",
  "Blood Donation Query": "high",
  "Technical Support": "high",
  "Organize Blood Drive": "medium",
  "Volunteer Opportunity": "medium",
  "Become a Donor": "medium",
  Partnership: "medium",
  "General Inquiry": "low",
};

const createContactMessage = async (data, userId) => {
  const { name, email, phone, subject, message } = data;

  const priority = subjectPriorityMap[subject] || "medium";

  const newContact = new ContactModel({
    userId,
    name,
    email,
    phone,
    subject,
    message,
    priority,
  });

  return await newContact.save();
};

const getUserContactHistory = async (userId) => {
  return await ContactModel.find({
    userId,
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();
};

module.exports = {
  createContactMessage,
  getUserContactHistory,
};