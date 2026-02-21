const express = require("express");
const donerRoute = express.Router();
const {
  donorLogin,
  deleteAccount,
  donerRegistration,
  getData,
  verifyOtp,
  sendOtp,
  forgotPasswordOtpValidation,
  resetPassword,
  resendOtp,
  contactUs,
  campApplication,
  updateHealthStatus,
  getDonorProfile,
  updateProfilePhoto,
  updateProfile,
  uploadDonationProof,
  getAllCamps,
  searchUser,
  deleteProfilePhoto,
  getDonationHistory,
  deleteDonationProof,
  chatbot,
} = require("../controllers/donerController");
const { authenticateToken } = require("../middleware/authentication");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});
const uploadDonation = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

donerRoute.post("/doner-register", donerRegistration);
donerRoute.post("/verify-otp", verifyOtp);
donerRoute.post("/login", donorLogin);
donerRoute.post("/send-otp", sendOtp); //for forgot pssword
donerRoute.post("/verify-forgot-otp", forgotPasswordOtpValidation);
donerRoute.post("/reset-password", resetPassword);
donerRoute.post("/resend-otp", resendOtp);
donerRoute.post("/contact", contactUs);
donerRoute.post("/applicationSubmission", campApplication);
donerRoute.post("/healthStatus", authenticateToken, updateHealthStatus);
donerRoute.get("/getAllCamps", getAllCamps);
donerRoute.get("/search-user", searchUser);
donerRoute.delete("/delete-account", authenticateToken, deleteAccount);
donerRoute.delete("/profile-photo", authenticateToken, deleteProfilePhoto);
donerRoute.get("/donation-history", authenticateToken, getDonationHistory);

donerRoute.delete("/delete-proof/:id", authenticateToken, deleteDonationProof);

donerRoute.get("/profile-details", authenticateToken, getDonorProfile);
donerRoute.put(
  "/profile-photo",
  authenticateToken,
  upload.single("profilePic"),
  updateProfilePhoto,
);
donerRoute.put("/update-profile", authenticateToken, updateProfile);
donerRoute.post(
  "/upload-proof",
  authenticateToken,
  uploadDonation.single("image"),
  uploadDonationProof,
);
donerRoute.post("/get-user-info", authenticateToken, getData);
donerRoute.post("/chatbot", chatbot);
module.exports = donerRoute;
