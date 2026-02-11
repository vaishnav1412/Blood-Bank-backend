const express = require("express")
const donerRoute = express.Router() 
const {donorLogin,donerRegistration,getData,verifyOtp,sendOtp,forgotPasswordOtpValidation,resetPassword,resendOtp,contactUs} = require("../controllers/donerController")
const {authenticateToken}=require("../middleware/authentication")


donerRoute.post("/doner-register",donerRegistration)
donerRoute.post("/verify-otp", verifyOtp);
donerRoute.post("/login",donorLogin)
donerRoute.post("/send-otp",sendOtp) //for forgot pssword
donerRoute.post("/verify-forgot-otp",forgotPasswordOtpValidation)
donerRoute.post("/reset-password",resetPassword)
donerRoute.post("/resend-otp",resendOtp)
donerRoute.post("/contact",contactUs)




donerRoute.post("/get-user-info", authenticateToken, getData);





module.exports = donerRoute