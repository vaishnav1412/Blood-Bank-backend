const galleryModel = require("../models/galleryModel");
const {fetchGalleryItems} = require("../services/galleryService");

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

    const item = await galleryModel.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to like item",
    });
  }
};


module.exports ={
    getGallery,
    likeGalleryItem
}