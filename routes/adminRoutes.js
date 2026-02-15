const express = require("express")
const adminRoute = express.Router() 
const {adminLogin} = require("../controllers/adminController")
const { authenticateTokenAdmin } = require("../middleware/adminAuthentication")
adminRoute.post("/login",adminLogin)






module.exports = adminRoute