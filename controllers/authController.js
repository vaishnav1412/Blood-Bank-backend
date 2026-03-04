const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const DonerModel = require("../models/donerModel");

const {
  sendOtpEmail,
  sendPasswordEmail,
} = require("../utilityFunctions/nodeMailer");
const generateStrongPassword = require("../utilityFunctions/passwordGenerator");

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

    // 1️⃣ Find user
    const user = await DonerModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register again.",
      });
    }

    // 2️⃣ Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
    }

    // 3️⃣ Minimum resend gap (60 seconds)
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

    // 4️⃣ Generate new 4-digit OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 5️⃣ Update user document
    user.otp = newOtp;
    user.otpExpires = otpExpires;

    await user.save();

    // 6️⃣ Send email (register purpose)
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
          donor.lockUntil = Date.now() + 10 * 60 * 1000; // 10 minutes
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

module.exports = {
  donerRegistration,
  donorLogin,
  verifyOtp,
  resendRegisterOtp,
};
