const mongoose = require("mongoose");

const donerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      required: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    weight: {
      type: Number,
      required: true,
      min: 40,
    },

    platelet: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },
    level: {
      type: String,
      enum: ["New Donor", "Regular Donor", "Hero Donor", "Life Saver"],
      default: "New Donor",
    },

    donationCount: {
      type: Number,
      required: true,
      min: 0,
    },
    latestDonatedDate: {
      type: Date,
      required: false,
      default: null,
    },

    district: {
      type: String,
      required: true,
    },

    taluk: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Enter valid 10-digit mobile number"],
    },

    whatsapp: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Enter valid 10-digit WhatsApp number"],
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Enter valid email address"],
    },

    password: {
      type: String,
      required: false,
    },

    // ✅ OTP Fields
    otp: {
      type: String,
      required: false,
    },

    otpExpires: {
      type: Date,
      required: false,
    },

    // ✅ Verification Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
    type: Number,
    default: 0 
  },
    profilePic: {
      type: String, // Cloudinary image URL
      default: "",
      required: false,
    },
  },
  { timestamps: true },
);

const DonerModel = mongoose.model("Doner", donerSchema);

module.exports = DonerModel;
