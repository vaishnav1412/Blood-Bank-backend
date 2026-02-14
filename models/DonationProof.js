const mongoose = require('mongoose');

const donationProofSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },

    donationDate: {
      type: String,
      required: true,
    },

    donationCenter: {
      type: String,
      required: true,
    },

    bloodGroup: {
      type: String,
    },

    units: {
      type: Number,
      default: 1,
    },

    proofImage: {
      type: String, // Cloudinary URL
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    adminRemarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DonationProof", donationProofSchema);
