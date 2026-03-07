const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const DonerModel = require("../models/donerModel");
const OTP = require("../models/otpModel");
const generateStrongPassword = require("../utilityFunctions/passwordGenerator");
const { sendOtpEmail, sendPasswordEmail } = require("../utilityFunctions/nodeMailer");


// REGISTER
const registerDonor = async (data) => {

  console.log("registering");
  
  const existingDonor = await DonerModel.findOne({ email: data.email });

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  if (existingDonor) {
    if (existingDonor.isVerified) {
      throw new Error("ALREADY_REGISTERED");
    }

    existingDonor.otp = otp;
    existingDonor.otpExpires = otpExpires;
    await existingDonor.save();

    await sendOtpEmail(data.email, otp, "register");

    return { message: "OTP resent" };
  }

  const donor = new DonerModel({
    ...data,
    otp,
    otpExpires,
    isVerified: false,
  });

  await donor.save();
  await sendOtpEmail(data.email, otp, "register");

  return { message: "OTP sent" };
};


// VERIFY OTP
const verifyRegistrationOtp = async (email, otp) => {
  const donor = await DonerModel.findOne({ email });

  if (!donor) throw new Error("USER_NOT_FOUND");
  if (donor.otpExpires < Date.now()) throw new Error("OTP_EXPIRED");
  if (donor.otp !== otp) throw new Error("INVALID_OTP");

  const password = generateStrongPassword(12);
  const hashedPassword = await bcrypt.hash(password, 10);

  donor.password = hashedPassword;
  donor.isVerified = true;
  donor.otp = null;
  donor.otpExpires = null;

  await donor.save();

  await sendPasswordEmail(email, password);

  return true;
};


// LOGIN
const loginDonor = async (email, password) => {
  const donor = await DonerModel.findOne({ email }).select("+password");

  if (!donor) throw new Error("INVALID_CREDENTIALS");

  if (donor.isBlocked) throw new Error("BLOCKED");
  if (donor.permanentBlock) throw new Error("PERMANENT_BLOCK");

  if (donor.lockUntil && donor.lockUntil > Date.now()) {
    throw new Error("TEMP_LOCK");
  }

  const match = await bcrypt.compare(password, donor.password);

  if (!match) {
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
    throw new Error("INVALID_CREDENTIALS");
  }

  donor.loginAttempts = 0;
  donor.lockUntil = null;
  await donor.save();

  const token = jwt.sign(
    { id: donor._id, email: donor.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return token;
};


// SEND OTP FOR PASSWORD RESET
const sendPasswordResetOtp = async (email, purpose) => {
  const user = await DonerModel.findOne({ email });

  if (!user) throw new Error("USER_NOT_FOUND");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OTP.create({
    email,
    otp,
    purpose,
    expiresAt,
  });

  await sendOtpEmail(email, otp, purpose);
};


// RESET PASSWORD
const resetUserPassword = async (email, otp, newPassword) => {
  const otpRecord = await OTP.findOne({
    email,
    otp,
    purpose: "password_reset",
    isUsed: true,
  });

  if (!otpRecord) throw new Error("INVALID_SESSION");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await DonerModel.updateOne(
    { email },
    { $set: { password: hashedPassword } }
  );

  await OTP.deleteMany({ email, purpose: "password_reset" });

  return true;
};

const validatePasswordResetOtp = async (email, otp) => {

  const otpRecord = await OTP.findOne({
    email: email,
    otp: otp,
    purpose: "password_reset",
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otpRecord) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  // mark OTP as used
  otpRecord.isUsed = true;
  await otpRecord.save();

  return true;
};


module.exports = {
  registerDonor,
  verifyRegistrationOtp,
  loginDonor,
  sendPasswordResetOtp,
  resetUserPassword,
  validatePasswordResetOtp
};