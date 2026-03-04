const express = require("express");
const donerRoute = express.Router();
const authController = require("../controllers/authController");
const contactController = require("../controllers/contactController")
const { authenticateToken } = require("../middleware/authentication");
const upload = require("../config/multer-config");

const {
  deleteAccount,
  getData,
  
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
  getMyContactHistory,
} = require("../controllers/donerController");

//--------------------auth controller-------------------

donerRoute.post("/doner-register", authController.donerRegistration);
donerRoute.post("/verify-otp", authController.verifyOtp);
donerRoute.post("/login", authController.donorLogin);
donerRoute.post("/resend-register-otp", authController.resendRegisterOtp);
donerRoute.post("/send-otp", authController.sendOtp); //forgot password
donerRoute.post("/verify-forgot-otp",authController.forgotPasswordOtpValidation);
donerRoute.post("/reset-password", authController.resetPassword);
donerRoute.post("/resend-otp", authController.resendOtp);

//-----------------------End AuthController-------------------------

//-----------------------Contact Controller-------------------------

donerRoute.post("/contact",contactController.contactUs);
donerRoute.post("/contact-private", authenticateToken, contactController.contactUs);

//-----------------------End Contact Controller----------------------



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
  upload.single("image"),
  uploadDonationProof,
);
donerRoute.post("/get-user-info", authenticateToken, getData);
donerRoute.post("/chatbot", chatbot);

donerRoute.get("/my-contacts-history", authenticateToken, getMyContactHistory);
module.exports = donerRoute;
