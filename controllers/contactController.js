const ContactModel = require("../models/contactUsModel");


const contactUs = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Detect user
    const userId = req.user ? req.user.id : null;

    // Assign priority automatically
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




module.exports ={
    contactUs
}