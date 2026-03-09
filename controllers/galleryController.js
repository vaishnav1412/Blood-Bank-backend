const galleryModel = require("../models/galleryModel");
const donorModel = require("../models/donerModel");
const {
  fetchGalleryItems,
  toggleLikeGalleryItem,
  addCommentToGallery,
} = require("../services/galleryService");

const getGallery = async (req, res) => {
  console.log("gallery working");

  try {
    const gallery = await fetchGalleryItems();

    res.status(200).json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    console.error("Fetch Gallery Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery",
    });
  }
};

const likeGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await toggleLikeGalleryItem(id, userId);

    res.json({
      success: true,
      likes: result.likes,
      liked: result.liked,
    });
  } catch (error) {
    console.error("LIKE ERROR:", error);

    if (error.message === "Item not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Like failed",
    });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const comments = await addCommentToGallery(id, userId, text);

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("COMMENT ERROR:", error);

    if (
      error.message === "Gallery item not found" ||
      error.message === "User not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Comment cannot be empty") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Comment failed",
    });
  }
};

module.exports = {
  getGallery,
  likeGalleryItem,
  addComment,
};
