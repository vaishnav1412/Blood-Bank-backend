const express = require("express")
const donerRoute = express.Router() 
const {donorLogin,donerRegistration,getData} = require("../controllers/donerController")
const {authenticateToken}=require("../middleware/authentication")





donerRoute.post("/login",donorLogin)
donerRoute.post("/doner-register",donerRegistration)


donerRoute.post("/get-user-info", authenticateToken, getData);





module.exports = donerRoute