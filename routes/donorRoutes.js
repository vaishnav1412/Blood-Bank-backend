const express = require("express");
const donorRoute = express.Router();

const authController = require("../controllers/authController");
const contactController = require("../controllers/contactController");
const profileController = require("../controllers/profileController");
const chatController = require("../controllers/chatController");
const campController = require("../controllers/campController");
const donationController = require("../controllers/donationController");
const galleryController = require("../controllers/galleryController")

const { authenticateToken } = require("../middleware/authentication");
const upload = require("../config/multer-config");


// ---------- AUTH ----------
donorRoute.post("/auth/register", authController.donerRegistration);
donorRoute.post("/auth/verify-otp", authController.verifyOtp);
donorRoute.post("/auth/resend-otp", authController.resendRegisterOtp);
donorRoute.post("/auth/login", authController.donorLogin);

donorRoute.post("/auth/forgot-password/send-otp", authController.sendOtp);
donorRoute.post("/auth/forgot-password/verify-otp", authController.forgotPasswordOtpValidation);

donorRoute.post("/auth/reset-password", authController.resetPassword);


// ---------- PUBLIC ----------
donorRoute.get("/camps", campController.getAllCamps);
donorRoute.post("/camps/apply", campController.campApplication);

donorRoute.post("/chatbot", chatController.chatbot);

donorRoute.post("/contact", contactController.contactUs);

donorRoute.get("/donations/search", donationController.searchUser);

donorRoute.get("/gallery",galleryController.getGallery)


// ---------- PROTECTED ----------
donorRoute.use(authenticateToken);


// PROFILE
donorRoute.get("/profile", profileController.getDonorProfile);
donorRoute.get("/profile/me", profileController.getData);
donorRoute.put("/profile", profileController.updateProfile);
donorRoute.put("/profile/photo", upload.single("profilePic"), profileController.updateProfilePhoto);
donorRoute.delete("/profile/photo", profileController.deleteProfilePhoto);
donorRoute.delete("/profile", profileController.deleteAccount);
donorRoute.post("/profile/health-status", profileController.updateHealthStatus);


// CONTACT
donorRoute.post("/contact/private", contactController.contactUs);
donorRoute.get("/contact/history", contactController.getMyContactHistory);


// DONATIONS
donorRoute.get("/donations/history", donationController.getDonationHistory);
donorRoute.post("/donations/proof", upload.single("image"), donationController.uploadDonationProof);
donorRoute.delete("/donations/proof:id", donationController.deleteDonationProof);





module.exports = donorRoute;