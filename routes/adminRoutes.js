const express = require("express")
const adminRoute = express.Router() 
const {adminLogin,getCount,getBloodGroupCount,getDashboardStats} = require("../controllers/adminController")
const { authenticateTokenAdmin } = require("../middleware/adminAuthentication")



adminRoute.post("/login",adminLogin)
adminRoute.get("/get-count",getCount)
adminRoute.get("/blood-group-count",getBloodGroupCount)
adminRoute.get("/dashboard-stats",getDashboardStats)






module.exports = adminRoute