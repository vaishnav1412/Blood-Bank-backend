const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["photo", "video", "quote"],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "donation-drive",
        "volunteer",
        "recognition",
        "motivational",
        "campaign",
      ],
      required: true,
    },

    image: {
      type: String, // for photo
    },

    thumbnail: {
      type: String, // for video thumbnail (optional)
    },

    videoUrl: {
      type: String, // for video
    },

    content: {
      type: String, // for quote
    },

    author: {
      type: String, // for quote
    },

    location: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      required: true,
    },

    tags: [
      {
        type: String,
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    likes: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

    comments: {
      type: Number,
      default: 0,
    },

    uploadedBy: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", gallerySchema);