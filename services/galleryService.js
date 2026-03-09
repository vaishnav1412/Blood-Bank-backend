const GalleryModel = require("../models/galleryModel");
const donorModel = require("../models/donerModel");

const fetchGalleryItems = async () => {
  const gallery = await GalleryModel.find({
    status: "published",
  }).sort({ createdAt: -1 });

  return gallery;
};

const toggleLikeGalleryItem = async (id, userId) => {
  const item = await GalleryModel.findById(id);

  if (!item) {
    throw new Error("Item not found");
  }

  if (!item.likes) item.likes = [];
  if (!Array.isArray(item.comments)) item.comments = [];

  const alreadyLiked = item.likes.some(
    (like) => like.toString() === userId.toString(),
  );

  if (alreadyLiked) {
    item.likes.pull(userId);
  } else {
    item.likes.push(userId);
  }

  await item.save();

  return {
    likes: item.likes.length,
    liked: !alreadyLiked,
  };
};

const addCommentToGallery = async (id, userId, text) => {
  if (!text || !text.trim()) {
    throw new Error("Comment cannot be empty");
  }

  const item = await GalleryModel.findById(id);

  if (!item) {
    throw new Error("Gallery item not found");
  }

  const user = await DonorModel.findById(userId).select("name");

  if (!user) {
    throw new Error("User not found");
  }

  const newComment = {
    userId,
    user: user.name,
    text,
    time: new Date(),
  };

  item.comments.push(newComment);

  await item.save();

  return item.comments;
};

module.exports = {
  fetchGalleryItems,
  toggleLikeGalleryItem,
  addCommentToGallery,
};
