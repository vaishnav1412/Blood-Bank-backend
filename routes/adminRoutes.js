const express = require("express");
const adminRoute = express.Router();
const {
  adminLogin,
  getCount,
  getBloodGroupCount,
  getDashboardStats,
  getAllUsers,
  blockUser,
  UnBlockUser,
  addDonor,
  uploadGallery,
  getAllGallery,
  updateGalleryItem,
  deleteGalleryItem,
  getAllContactMessages,
  deleteContacts,
  updateContactStatus,
  replyToContact,
  getAllDonations,
  updateDonationStatus
 

} = require("../controllers/adminController");
const { authenticateTokenAdmin } = require("../middleware/adminAuthentication");
const video_upload = require("../middleware/video_upload");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});

adminRoute.post("/login", adminLogin);
adminRoute.get("/get-count", getCount);
adminRoute.get("/blood-group-count", getBloodGroupCount);
adminRoute.get("/dashboard-stats", getDashboardStats);
adminRoute.get("/get-all-users", getAllUsers);
adminRoute.post("/block-user", blockUser);
adminRoute.post("/unblock-user", UnBlockUser);
adminRoute.post("/add-donor", upload.single("profilePic"), addDonor);
adminRoute.post("/upload-gallery", video_upload.single("media"), uploadGallery);
adminRoute.put(
  "/update-gallery/:id",
  video_upload.single("media"),
  updateGalleryItem,
);
adminRoute.get("/gallery-items", getAllGallery);
adminRoute.get("/contact-messages", getAllContactMessages);
adminRoute.delete("/delete-contacts", deleteContacts);
adminRoute.delete("/delete-gallery/:id", deleteGalleryItem);
adminRoute.patch("/update-contact-status/:id",updateContactStatus)
adminRoute.put("/contact-reply/:id",authenticateTokenAdmin,replyToContact);
adminRoute.get('/donations',getAllDonations)
adminRoute.put("/donations/:id", updateDonationStatus);

module.exports = adminRoute;
