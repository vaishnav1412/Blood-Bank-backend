const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Change to "Admin" if you have separate Admin model
      required: true,
    },

    replyMessage: {
      type: String,
      required: true,
      trim: true,
    },

    repliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ContactSchema = new mongoose.Schema(
  {
    // If user is logged in
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Basic Contact Info
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

    // Message Details
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [10, "Message must be at least 10 characters long"],
      trim: true,
    },

    // Priority System
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Ticket Status
    status: {
      type: String,
      enum: ["unread", "read", "in-progress", "closed"],
      default: "unread",
    },

    // Whether admin replied
    replied: {
      type: Boolean,
      default: false,
    },

    // Replies Array
    replies: [ReplySchema],

    // Last reply timestamp (for sorting by latest activity)
    lastRepliedAt: {
      type: Date,
      default: null,
    },

    // Soft delete (enterprise-level practice)
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

module.exports = mongoose.model("Contact", ContactSchema);