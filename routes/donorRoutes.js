const express = require("express");
const donorRoute = express.Router();
const authController = require("../controllers/authController");
const contactController = require("../controllers/contactController")
const profileController =require("../controllers/profileController")
const chatController =require("../controllers/chatController")
const campController =require("../controllers/campController")
const donationController =require("../controllers/donationController")
const { authenticateToken } = require("../middleware/authentication");
const upload = require("../config/multer-config");

donorRoute.post("/doner-register", authController.donerRegistration);
donorRoute.post("/verify-otp", authController.verifyOtp);
donorRoute.post("/login", authController.donorLogin);
donorRoute.post("/resend-register-otp", authController.resendRegisterOtp);
donorRoute.post("/send-otp", authController.sendOtp); //forgot password
donorRoute.post("/verify-forgot-otp",authController.forgotPasswordOtpValidation);
donorRoute.post("/reset-password", authController.resetPassword);
donorRoute.post("/resend-otp", authController.resendOtp);

donorRoute.post("/contact",contactController.contactUs);
donorRoute.post("/contact-private", authenticateToken, contactController.contactUs);
donorRoute.get("/my-contacts-history", authenticateToken, contactController.getMyContactHistory);

donorRoute.post("/chatbot", chatController.chatbot);

donorRoute.post("/applicationSubmission",campController.campApplication);
donorRoute.get("/getAllCamps", campController.getAllCamps);

donorRoute.get("/search-user", donationController.searchUser);

donorRoute.use(authenticateToken)

donorRoute.post("/healthStatus", profileController.updateHealthStatus);
donorRoute.delete("/delete-account", profileController.deleteAccount);
donorRoute.delete("/profile-photo", profileController.deleteProfilePhoto);
donorRoute.get("/profile-details",profileController.getDonorProfile);
donorRoute.put("/profile-photo",upload.single("profilePic"),profileController.updateProfilePhoto);
donorRoute.put("/update-profile",profileController.updateProfile);
donorRoute.post("/get-user-info",profileController.getData);

donorRoute.get("/donation-history",donationController.getDonationHistory);
donorRoute.delete("/delete-proof/:id",donationController.deleteDonationProof);
donorRoute.post("/upload-proof",upload.single("image"), donationController.uploadDonationProof);

module.exports = donorRoute ;
