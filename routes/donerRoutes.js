const express = require("express");
const donerRoute = express.Router();
const authController = require("../controllers/authController");
const contactController = require("../controllers/contactController")
const profileController =require("../controllers/profileController")
const chatController =require("../controllers/chatController")
const campController =require("../controllers/campController")
const donationController =require("../controllers/donationController")
const { authenticateToken } = require("../middleware/authentication");
const upload = require("../config/multer-config");

donerRoute.post("/doner-register", authController.donerRegistration);
donerRoute.post("/verify-otp", authController.verifyOtp);
donerRoute.post("/login", authController.donorLogin);
donerRoute.post("/resend-register-otp", authController.resendRegisterOtp);
donerRoute.post("/send-otp", authController.sendOtp); //forgot password
donerRoute.post("/verify-forgot-otp",authController.forgotPasswordOtpValidation);
donerRoute.post("/reset-password", authController.resetPassword);
donerRoute.post("/resend-otp", authController.resendOtp);

donerRoute.post("/contact",contactController.contactUs);
donerRoute.post("/contact-private", authenticateToken, contactController.contactUs);
donerRoute.get("/my-contacts-history", authenticateToken, contactController.getMyContactHistory);

donerRoute.post("/healthStatus", authenticateToken, profileController.updateHealthStatus);
donerRoute.delete("/delete-account", authenticateToken, profileController.deleteAccount);
donerRoute.delete("/profile-photo", authenticateToken, profileController.deleteProfilePhoto);
donerRoute.get("/profile-details", authenticateToken, profileController.getDonorProfile);
donerRoute.put("/profile-photo",authenticateToken,upload.single("profilePic"),profileController.updateProfilePhoto);
donerRoute.put("/update-profile", authenticateToken, profileController.updateProfile);
donerRoute.post("/get-user-info", authenticateToken, profileController.getData);

donerRoute.post("/chatbot", chatController.chatbot);

donerRoute.post("/applicationSubmission",campController.campApplication);
donerRoute.get("/getAllCamps", campController.getAllCamps);

donerRoute.get("/search-user", donationController.searchUser);
donerRoute.get("/donation-history", authenticateToken, donationController.getDonationHistory);
donerRoute.delete("/delete-proof/:id", authenticateToken, donationController.deleteDonationProof);
donerRoute.post("/upload-proof",authenticateToken,upload.single("image"), donationController.uploadDonationProof);

module.exports = donerRoute;
