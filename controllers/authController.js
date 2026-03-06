const authService = require("../services/authService");


// ---------------- REGISTER ----------------
const donerRegistration = async (req, res) => {
  try {
    const result = await authService.registerDonor(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error) {

    if (error.message === "ALREADY_REGISTERED") {
      return res.status(409).json({
        success: false,
        message: "Donor already registered and verified. Please login.",
      });
    }

    console.error("Registration Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};


// ---------------- VERIFY REGISTER OTP ----------------
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    await authService.verifyRegistrationOtp(email, otp);

    res.status(200).json({
      success: true,
      message: "Email verified successfully. Password sent to your email.",
    });

  } catch (error) {

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found" });
    }

    if (error.message === "OTP_EXPIRED") {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (error.message === "INVALID_OTP") {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    console.error("OTP Verification Error:", error);

    res.status(500).json({
      message: "Server error during verification",
    });
  }
};


// ---------------- RESEND REGISTER OTP ----------------
const resendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;

    await authService.resendRegisterOtp(email);

    res.json({
      success: true,
      message: "New OTP sent successfully",
    });

  } catch (error) {

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register again.",
      });
    }

    if (error.message === "EMAIL_ALREADY_VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Email already verified. Please login.",
      });
    }

    if (error.message === "OTP_RATE_LIMIT") {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting a new OTP.",
      });
    }

    console.error("Resend OTP Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ---------------- LOGIN ----------------
const donorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const token = await authService.loginDonor(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });

  } catch (error) {

    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (error.message === "BLOCKED") {
      return res.status(403).json({
        message: "Your account has been blocked by admin.",
      });
    }

    if (error.message === "PERMANENT_BLOCK") {
      return res.status(403).json({
        message: "Account permanently blocked. Contact support.",
      });
    }

    if (error.message === "TEMP_LOCK") {
      return res.status(403).json({
        message: "Account temporarily locked. Try again later.",
      });
    }

    console.error("Login Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ---------------- SEND FORGOT PASSWORD OTP ----------------
const sendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    await authService.sendPasswordResetOtp(email, purpose);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    console.error("Send OTP Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ---------------- VALIDATE FORGOT PASSWORD OTP ----------------
const forgotPasswordOtpValidation = async (req, res) => {
  try {
    console.log("djhfgdjfg");
    
    const { email, otp } = req.body;

    await authService.validatePasswordResetOtp(email, otp);

    res.json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {

    if (error.message === "INVALID_OTP") {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    console.error("OTP Validation Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ---------------- RESET PASSWORD ----------------
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, otp } = req.body;

    await authService.resetUserPassword(email, otp, newPassword);

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please login.",
    });

  } catch (error) {

    if (error.message === "INVALID_SESSION") {
      return res.status(400).json({
        success: false,
        message: "Invalid session or OTP. Please restart the process.",
      });
    }

    console.error("Reset Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  donerRegistration,
  verifyOtp,
  resendRegisterOtp,
  donorLogin,
  sendOtp,
  forgotPasswordOtpValidation,
  resetPassword,
};