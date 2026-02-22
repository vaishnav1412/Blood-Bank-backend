const multer = require("multer");

const storage = multer.memoryStorage(); // Store file in memory

const video_upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = video_upload;