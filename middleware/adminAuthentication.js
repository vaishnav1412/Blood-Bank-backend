   
const jwt = require("jsonwebtoken");

const authenticateTokenAdmin = (req, res, next) => {
  console.log("health one");
  
  try {
    const authHeader = req.headers.authorization;

    // Check header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Must start with Bearer
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Use Bearer token.",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET_ADMIN, (err, decodedUser) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token expired or invalid.",
        });
      }

      req.admin = decodedUser;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in authentication middleware.",
    });
  }
};

module.exports = { authenticateTokenAdmin };
