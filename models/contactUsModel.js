const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [10, "Message must be at least 10 characters long"],
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },

    replied: {
      type: Boolean,
      default: false,
    },

    // Array to store replies from admin
    replies: [
      {
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the admin who replied
        replyMessage: { type: String, required: true }, // The content of the admin's reply
        repliedAt: { type: Date, default: Date.now }, // Timestamp of the reply
      },
    ],
  },
  {
    timestamps: true, // To track when the original contact was created/updated
  }
);

module.exports = mongoose.model("Contact", ContactSchema);