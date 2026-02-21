const express = require("express")
const adminRoute = express.Router() 
const {adminLogin,getCount,getBloodGroupCount,getDashboardStats,getAllUsers,blockUser,UnBlockUser,addDonor} = require("../controllers/adminController")
const { authenticateTokenAdmin } = require("../middleware/adminAuthentication")

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});

adminRoute.post("/login",adminLogin)
adminRoute.get("/get-count",getCount)
adminRoute.get("/blood-group-count",getBloodGroupCount)
adminRoute.get("/dashboard-stats",getDashboardStats)
adminRoute.get("/get-all-users",getAllUsers)
adminRoute.post("/block-user",blockUser)
adminRoute.post("/unblock-user",UnBlockUser)
adminRoute.post("/add-donor",upload.single("profilePic"),addDonor)





module.exports = adminRoute