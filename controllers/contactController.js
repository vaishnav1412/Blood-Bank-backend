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

const contactUs = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const userId = req.user ? req.user.id : null;

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

    await newContact.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newContact,
    });
  } catch (error) {
    console.error("Contact Form Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error. Could not submit form.",
    });
  }
};

const getMyContactHistory = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const contacts = await ContactModel.find({
      userId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    res.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Get contact history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact history",
    });
  }
};

module.exports = {
  contactUs,
  getMyContactHistory
};
