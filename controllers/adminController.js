const AdminModel = require("../models/donerModel")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs")

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ 1. Check email & password entered
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // ✅ 2. Find user by email
    const user = await AdminModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
  console.log(user.password);
  
    // ✅ 3. Compare password
    const isMatch = await bcrypt.compare(password,user.password)

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ✅ 4. Check Admin Access
    if (user.isAdmin !== 1) {
      return res.status(403).json({
        message: "You are not an admin. Access denied!",
      });
    }

    // ✅ 5. Generate Admin Token
    const token = jwt.sign(
      {
        id: user._id,
        role: "admin",
        isAdmin: 1,
      },
      process.env.JWT_SECRET_ADMIN,
      { expiresIn: "1d" }
    );

    // ✅ 6. Send Response
    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      adminToken: token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports ={
    adminLogin
}