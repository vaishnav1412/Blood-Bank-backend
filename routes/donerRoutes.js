const express = require("express")
const donerRoute = express.Router() 
const {donorLogin,donerRegistration,getData,verifyOtp,sendOtp} = require("../controllers/donerController")
const {authenticateToken}=require("../middleware/authentication")


donerRoute.post("/doner-register",donerRegistration)
donerRoute.post("/verify-otp", verifyOtp);
donerRoute.post("/login",donorLogin)
donerRoute.post("/send-otp",sendOtp) //for forgot pssword




donerRoute.post("/get-user-info", authenticateToken, getData);





module.exports = donerRoute