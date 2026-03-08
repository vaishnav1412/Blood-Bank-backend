const GalleryModel = require("../models/galleryModel");

const fetchGalleryItems = async () => {
  const gallery = await GalleryModel.find({
    status: "published",
  }).sort({ createdAt: -1 });

  return gallery;
};

module.exports = {
  fetchGalleryItems,
};