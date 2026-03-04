const contactService = require("../services/contactService");

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

    const newContact = await contactService.createContactMessage(
      req.body,
      userId
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newContact,
    });

  } catch (error) {
    console.error("Contact Form Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error. Could not submit form.",
    });
  }
};

const getMyContactHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const contacts = await contactService.getUserContactHistory(userId);

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
  getMyContactHistory,
};