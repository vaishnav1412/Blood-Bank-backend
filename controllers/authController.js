const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const DonerModel = require("../models/donerModel");
const OTP = require("../models/otpModel");
const generateStrongPassword = require("../utilityFunctions/passwordGenerator");
const {
  sendOtpEmail,
  sendPasswordEmail,
} = require("../utilityFunctions/nodeMailer");

//---------------------Registration Part--------------------------

const donerRegistration = async (req, res) => {
  try {
    const {
      name,
      gender,
      bloodGroup,
      dob,
      weight,
      platelet,
      donationCount,
      district,
      taluk,
      mobile,
      whatsapp,
      email,
      reEmail,
    } = req.body;
    if (
      !name ||
      !gender ||
      !bloodGroup ||
      !dob ||
      !weight ||
      donationCount === undefined ||
      !district ||
      !taluk ||
      !mobile ||
      !whatsapp ||
      !email ||
      !reEmail
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (email !== reEmail) {
      return res.status(400).json({ message: "Emails do not match" });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobile) || !phoneRegex.test(whatsapp)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (weight < 45) {
      return res.status(400).json({ message: "Weight must be at least 45kg" });
    }

    let level = "New Donor";
    if (donationCount >= 10) level = "Life Saver";
    else if (donationCount >= 5) level = "Hero Donor";
    else if (donationCount >= 1) level = "Regular Donor";

    const existingDonor = await DonerModel.findOne({ email });

    if (existingDonor) {
      if (existingDonor.isVerified) {
        return res.status(409).json({
          message: "Donor already registered and verified. Please login.",
        });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      existingDonor.otp = otp;
      existingDonor.otpExpires = otpExpires;
      await existingDonor.save();
      await sendOtpEmail(email, otp, "register");
      return res.status(200).json({
        message: "OTP resent. Please verify your email.",
      });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const newDonor = new DonerModel({
      name,
      gender,
      bloodGroup,
      dob,
      weight,
      platelet,
      donationCount,
      level,
      district,
      taluk,
      mobile,
      whatsapp,
      email,
      otp,
      otpExpires,
      isVerified: false,
    });
    await newDonor.save();
    await sendOtpEmail(email, otp, "register");
    return res.status(200).json({
      message: "OTP sent to email. Please verify to complete registration.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const donor = await DonerModel.findOne({ email });
    if (!donor) return res.status(404).json({ message: "User not found" });
    if (donor.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    if (donor.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const generatedPassword = generateStrongPassword(12);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);
    await sendPasswordEmail(email, generatedPassword);
    donor.otp = null;
    donor.otpExpires = null;
    donor.isVerified = true;
    donor.password = hashedPassword;
    await donor.save();
    return res.json({
      message: "Email verified successfully. Password sent to your email.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
};

const resendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await DonerModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register again.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
    }

    if (user.otpExpires) {
      const timeSinceLastOtp = Date.now() - new Date(user.updatedAt).getTime();

      if (timeSinceLastOtp < 60000) {
        const waitTime = Math.ceil((60000 - timeSinceLastOtp) / 1000);

        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
        });
      }
    }

    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = newOtp;
    user.otpExpires = otpExpires;

    await user.save();

    await sendOtpEmail(email, newOtp, "register");

    console.log(`Register OTP resent to ${email}`);

    return res.json({
      success: true,
      message: "New OTP sent successfully.",
      expiresAt: otpExpires,
    });
  } catch (error) {
    console.error("Register resend OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

//---------------------End Registration Part---------------------------

//---------------------Login Part --------------------------------------

const donorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required." });
    }
    const donor = await DonerModel.findOne({ email }).select("+password");
    if (!donor) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (donor.isBlocked) {
      return res.status(403).json({
        message:
          "Your account has been blocked by admin. Please contact support.",
      });
    }
    if (donor.permanentBlock) {
      return res.status(403).json({
        message: "Account permanently blocked. Contact support.",
      });
    }
    if (donor.lockUntil && donor.lockUntil > Date.now()) {
      return res.status(403).json({
        message: "Account temporarily locked. Try again later.",
      });
    }
    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) {
      donor.loginAttempts += 1;
      if (donor.loginAttempts >= 5) {
        donor.tempBlockCount += 1;
        if (donor.tempBlockCount >= 2) {
          donor.permanentBlock = true;
        } else {
          donor.lockUntil = Date.now() + 10 * 60 * 1000;
        }
        donor.loginAttempts = 0;
      }
      await donor.save();
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }
    donor.loginAttempts = 0;
    donor.lockUntil = null;
    await donor.save();
    const token = jwt.sign(
      { id: donor._id, email: donor.email, role: donor.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    return res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

//---------------------End Login Part----------------------------------

//---------------------Forgot Password Part-----------------------------

const sendOtp = async (req, res) => {
  const { email, purpose } = req.body;

  try {
    const user = await DonerModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({
      email: email,
      otp: otp,
      purpose: purpose,
      expiresAt: expiresAt,
    });

    await sendOtpEmail(email, otp, purpose);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log("OTP Save Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const forgotPasswordOtpValidation = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({
      email: email,
      otp: otp,
      purpose: "password_reset",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    res.json({
      success: true,
      userId: otpRecord.userId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword, otp } = req.body;

  try {
    if (!email || !newPassword || !otp) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const otpRecord = await OTP.findOne({
      email: email,
      otp: otp,
      purpose: "password_reset",
      isUsed: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid session or OTP. Please restart the process.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await DonerModel.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
        },
      },
    );

    await OTP.deleteMany({
      email: email,
      purpose: "password_reset",
    });

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please login.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again later.",
    });
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await DonerModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found. Please check and try again.",
      });
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentOTPs = await OTP.find({
      email: email,
      purpose: "password_reset",
      createdAt: { $gt: fiveMinsAgo },
    });

    if (recentOTPs.length >= 3) {
      return res.status(429).json({
        success: false,
        message:
          "Too many OTP requests. Please wait 5 minutes before trying again.",
      });
    }

    const lastOTP = await OTP.findOne({
      email: email,
      purpose: "password_reset",
    }).sort({ createdAt: -1 });

    if (lastOTP) {
      const timeSinceLastOTP = Date.now() - lastOTP.createdAt.getTime();

      if (timeSinceLastOTP < 30000) {
        const waitTime = Math.ceil((30000 - timeSinceLastOTP) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
        });
      }

      lastOTP.isExpired = true;
      await lastOTP.save();
    }

    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await OTP.create({
      userId: user._id,
      email: email,
      otp: newOTP,
      purpose: "password_reset",
      expiresAt: expiresAt,
      isResend: true,
      resendCount: recentOTPs.length + 1,
    });

    await sendOtpEmail(email, newOTP, "password_reset");

    console.log(`OTP resent to ${email} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: "New OTP sent successfully.",
      expiresAt: expiresAt,
      resendCount: recentOTPs.length + 1,
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

//------------------------End Forgott Password Part -------------------------

module.exports = {
  donerRegistration,
  donorLogin,
  verifyOtp,
  resendRegisterOtp,
  sendOtp,
  forgotPasswordOtpValidation,
  resetPassword,
  resendOtp,
};
