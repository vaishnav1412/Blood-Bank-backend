const DonerModel = require("../models/donerModel");
const HealthStatusModel = require("../models/HealthStatusModel");
const OTP = require("../models/otpModel");
const ContactModel = require("../models/contactUsModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApplicationModel = require("../models/bloodDriveModel");
const DonationProof = require("../models/DonationProof");
const multer = require("multer");
const cloudinary = require("../config/cloudinary-config");
const axios = require("axios");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const generateStrongPassword = require("../utilityFunctions/passwordGenerator");
const {
  sendOtpEmail,
  sendPasswordEmail,
} = require("../utilityFunctions/nodeMailer");

const getData = async (req, res) => {
  try {
    const _id = req.user.id;
    const userData = await DonerModel.findById(_id).select("-password");
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user: userData });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};


//forgott password otp generation ,sending

const sendOtp = async (req, res) => {
  const { email, purpose } = req.body;

  console.log(purpose);

  try {
    // Check if user exists
    const user = await DonerModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log(otp, email, purpose, expiresAt);

    // Save OTP to database
    await OTP.create({
      email: email,
      otp: otp,
      purpose: purpose,
      expiresAt: expiresAt,
    });
    console.log("hai");

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
  console.log(email, otp);

  try {
    const otpRecord = await OTP.findOne({
      email: email,
      otp: otp,
      purpose: "password_reset",
      isUsed: false,
      expiresAt: { $gt: new Date() }, // ✅ Correct MongoDB syntax
    });

    console.log(otpRecord, "hhhh");

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }
    console.log("close");

    // Mark OTP as used
    otpRecord.isUsed = true; // Update the data in memory
    await otpRecord.save(); // Commit to database (triggers validation/hooks)

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
  console.log("loading....");

  const { email, newPassword, otp } = req.body;

  console.log(req.body);

  try {
    // 1. Validation
    if (!email || !newPassword || !otp) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // 2. Validate Password Strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // 3. Verify OTP (Mongoose Syntax)
    // We look for a record that matches the email/otp and was previously marked as 'verified/used'
    const otpRecord = await OTP.findOne({
      email: email,
      otp: otp,
      purpose: "password_reset",
      isUsed: true, // Assuming your verification step set this to true
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid session or OTP. Please restart the process.",
      });
    }

    // 4. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update User Password (Mongoose Syntax)
    // We use findByIdAndUpdate
    await DonerModel.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
        },
      },
    );

    // 6. Clean up used OTP records (Mongoose Syntax)
    // We use deleteMany to remove all used reset attempts for this user
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
    // 1. Check if user exists
    const user = await DonerModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found. Please check and try again.",
      });
    }

    // 2. Check rate limiting - prevent OTP flooding (Last 5 minutes)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentOTPs = await OTP.find({
      email: email,
      purpose: "password_reset",
      createdAt: { $gt: fiveMinsAgo }, // ✅ Mongoose syntax uses $gt
    });

    // Limit to 3 resends in 5 minutes
    if (recentOTPs.length >= 3) {
      return res.status(429).json({
        success: false,
        message:
          "Too many OTP requests. Please wait 5 minutes before trying again.",
      });
    }

    // 3. Check last OTP sent time (minimum 30 seconds gap)
    // Sort by createdAt descending to get the latest one
    const lastOTP = await OTP.findOne({
      email: email,
      purpose: "password_reset",
    }).sort({ createdAt: -1 });

    if (lastOTP) {
      // Calculate time difference in milliseconds
      const timeSinceLastOTP = Date.now() - lastOTP.createdAt.getTime();

      if (timeSinceLastOTP < 30000) {
        // 30 seconds
        const waitTime = Math.ceil((30000 - timeSinceLastOTP) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
        });
      }

      // Mark previous OTP as expired explicitly (Optional, but good for cleanup)
      lastOTP.isExpired = true;
      await lastOTP.save(); // ✅ Mongoose save syntax
    }

    // 4. Generate new 6-digit OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 5. Save new OTP to database
    await OTP.create({
      userId: user._id, // ✅ Mongoose uses _id
      email: email,
      otp: newOTP,
      purpose: "password_reset",
      expiresAt: expiresAt,
      isResend: true,
      resendCount: recentOTPs.length + 1,
    });

    // 6. Send OTP via email
    // Note: Make sure this function name matches your export
    await sendOtpEmail(email, newOTP, "password_reset");

    // 7. Log the resend attempt
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

const subjectPriorityMap = {
  "Emergency Request": "urgent",
  "Blood Donation Query": "high",
  "Technical Support": "high",
  "Organize Blood Drive": "medium",
  "Volunteer Opportunity": "medium",
  "Become a Donor": "medium",
  Partnership: "medium",
  "General Inquiry": "low",
};

const contactUs = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Detect user
    const userId = req.user ? req.user.id : null;

    // Assign priority automatically
    const priority = subjectPriorityMap[subject] || "medium";

    const newContact = new ContactModel({
      userId,
      name,
      email,
      phone,
      subject,
      message,
      priority,
    });

    await newContact.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newContact,
    });
  } catch (error) {
    console.error("Contact Form Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error. Could not submit form.",
    });
  }
};

const campApplication = async (req, res) => {
  try {
    // 1. Extract data from request body
    const data = req.body;

    // 2. Generate a custom Application ID (e.g., BD-849302)
    // We match the logic used in the frontend for consistency
    const applicationId = `BD-${Date.now().toString().slice(-6)}`;

    // 3. Create new application instance
    const newApplication = new ApplicationModel({
      ...data,
      applicationId: applicationId,
    });

    // 4. Save to Database
    await newApplication.save();

    console.log(
      `New Blood Drive Application: ${applicationId} by ${data.organizationName}`,
    );

    // 5. Send Success Response
    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      applicationId: applicationId,
      data: newApplication,
    });
  } catch (error) {
    console.error("Blood Drive Submission Error:", error);

    // Handle Mongoose Validation Errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle Duplicate Key Errors (e.g., same Application ID generated twice)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate submission detected. Please try again.",
      });
    }

    // Handle General Server Errors
    res.status(500).json({
      success: false,
      message: "Server Error. Could not submit application.",
    });
  }
};

const updateHealthStatus = async (req, res) => {
  try {
    // 1. Get donor ID from the request object (attached by authMiddleware)
    const donorId = req.user.id;
    console.log(donorId);

    // 2. Destructure data from request body
    const { weight, platelet, medicalConditions, allergies } = req.body;

    // 3. Validate (Basic)
    if (!weight || !platelet) {
      return res.status(400).json({
        success: false,
        message: "Weight and Platelet count are required",
      });
    }

    // 4. Update the Donor
    // { new: true } ensures we get the updated document back
    const healthData = await HealthStatusModel.findOneAndUpdate(
      { _id: donorId },
      {
        weight,
        platelet,
        lastHealthCheck: Date.now(),
        medicalConditions: medicalConditions || "None",
        allergies: allergies || "None",
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    if (!healthData) {
      return res.status(404).json({ message: "Donor not found" });
    }

    // 5. Send Response
    res.status(200).json({
      success: true,
      message: "Health status updated successfully",
      donor: healthData,
    });
  } catch (error) {
    console.error("Health Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getDonorProfile = async (req, res) => {
  console.log("pppp");
  try {
    // ✅ Get donorId from JWT
    const donorId = req.user.id;
    console.log(donorId);

    // ✅ Fetch donor details
    const donor = await DonerModel.findById(donorId).select("-password");

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    // ✅ Fetch health details
    const health = await HealthStatusModel.findOne({ _id: donorId });

    // ✅ Send combined response
    res.status(200).json({
      success: true,
      donor,
      health: health || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
};

const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 1. Convert buffer to Base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // 2. Define a FIXED name for the file using the User's ID
    // This ensures the file is always named "user_profiles/USER_ID"
    const publicId = `user_profiles/${req.user.id}`;

    // 3. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      public_id: publicId, // <--- Force this name
      overwrite: true, // <--- If file exists, replace it
      invalidate: true, // <--- Clear CDN cache so old image disappears immediately
      folder: "user_profiles",
      transformation: [{ width: 500, height: 500, crop: "fill" }],
    });

    // 4. Update User in Database
    // We only need to save the URL. The ID is fixed logic.
    const updatedUser = await DonerModel.findByIdAndUpdate(
      req.user.id,
      { profilePic: result.secure_url },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully (Old photo replaced)",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Error uploading photo" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const donorId = req.user.id;

    const updatedDonor = await DonerModel.findByIdAndUpdate(
      donorId,
      {
        name: req.body.name,
        gender: req.body.gender,
        bloodGroup: req.body.bloodGroup,
        dob: req.body.dob,

        weight: req.body.weight,
        platelet: req.body.platelet,
        donationCount: req.body.donationCount,

        district: req.body.district,
        taluk: req.body.taluk,

        mobile: req.body.mobile,
        whatsapp: req.body.whatsapp,

        email: req.body.email,
        emergencyContact: req.body.emergencyContact,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Profile updated successfully",
      donor: updatedDonor,
    });
  } catch (error) {
    console.log("Update Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const uploadDonationProof = async (req, res) => {
  try {
    // ✅ Check file
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const donorId = req.user.id;

    const { donationDate, donationCenter, bloodGroup, units } = req.body;
    console.log("photo upload...", req.body);
    // ✅ Validate required fields
    if (!donationDate || !donationCenter) {
      return res.status(400).json({
        message: "Donation Date and Center are required",
      });
    }

    // ✅ Convert buffer → Base64 (same as profile pic)
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // ✅ Unique Public ID (DON'T overwrite)
    const publicId = `donation_proofs/${donorId}_${Date.now()}`;

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      public_id: publicId,
      folder: "donation_proofs",

      transformation: [{ width: 800, height: 800, crop: "limit" }],
    });
    console.log("test");

    // ✅ Save Proof in MongoDB
    const newProof = new DonationProof({
      donorId,
      donationDate,
      donationCenter,
      bloodGroup,
      units,
      proofImage: result.secure_url,
      status: "pending",
    });

    const response = await newProof.save();

    res.status(201).json({
      success: true,
      message: "Donation proof uploaded successfully!",
      proof: newProof,
    });
  } catch (error) {
    console.error("Donation Upload Error:", error);
    res.status(500).json({
      message: "Error uploading donation proof",
    });
  }
};

const getAllCamps = async (req, res) => {
  try {
    const camps = await ApplicationModel.find()
      .sort({ createdAt: -1 })
      .limit(3);

    if (!camps || camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No camp requests found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Camp requests fetched successfully",
      total: camps.length,
      camps,
    });
  } catch (error) {
    console.error("Error fetching camps:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching camp requests",
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const { district, taluk, bloodGroup } = req.query;
    console.log("working");

    let filter = {};

    if (district) filter.district = district;
    if (taluk) filter.taluk = taluk;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const donors = await DonerModel.find(filter);

    res.status(200).json({
      success: true,
      donors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const donorId = req.user.id;

    await DonerModel.findByIdAndDelete(donorId);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting account",
    });
  }
};
const deleteProfilePhoto = async (req, res) => {
  try {
    const donorId = req.user.id;
    if (!donorId) {
      return res.status(401).json({
        message: "Unauthorized: Donor ID not found",
      });
    }
    const donor = await DonerModel.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        message: "Donor not found",
      });
    }
    if (!donor.profilePic) {
      return res.status(400).json({
        message: "No profile photo to remove",
      });
    }
    donor.profilePic = null;
    await donor.save();
    return res.status(200).json({
      message: "Profile photo removed successfully",
      donor,
    });
  } catch (error) {
    console.error("Delete Profile Photo Error:", error);
    return res.status(500).json({
      message: "Server error while deleting profile photo",
      error: error.message,
    });
  }
};

const getDonationHistory = async (req, res) => {
  try {
    const donorId = req.user.id;

    if (!donorId) {
      return res.status(401).json({
        message: "Unauthorized access",
      });
    }

    // ✅ Find donor donation proofs (history)
    const proofs = await DonationProof.find({ donorId });
    console.log(proofs);

    if (!proofs) {
      return res.status(404).json({
        message: "Donor not found",
      });
    }

    return res.status(200).json({
      message: "Donation history fetched successfully",
      history: proofs || [],
    });
  } catch (error) {
    console.error("Fetch Donation History Error:", error);

    return res.status(500).json({
      message: "Server error while fetching donation history",
      error: error.message,
    });
  }
};

const deleteDonationProof = async (req, res) => {
  try {
    const donorId = req.user.id;
    const proofId = req.params.id;

    // ✅ Find Proof
    const proof = await DonationProof.findById(proofId);

    if (!proof) {
      return res.status(404).json({
        message: "Donation proof not found",
      });
    }

    // ✅ Only Owner Can Delete
    if (proof.donorId.toString() !== donorId) {
      return res.status(403).json({
        message: "Unauthorized action",
      });
    }

    // ❌ Optional: Cloudinary delete here if needed

    // ✅ Delete Proof
    await DonationProof.findByIdAndDelete(proofId);

    res.status(200).json({
      message: "Donation proof deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Proof Error:", error);

    res.status(500).json({
      message: "Server error while deleting donation proof",
    });
  }
};

const chatbot = async (req, res) => {
  try {
    const userMessage = req.body.message;

    console.log("User:", userMessage);

    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `You are a blood donation assistant. Answer in short.\nUser: ${userMessage}\nBot:`,
        stream: false,
      }),
    });

    const data = await response.json();

    console.log("Bot Reply:", data.response);

    res.json({ reply: data.response });
  } catch (error) {
    console.log("Ollama Error:", error);
    res.status(500).json({ error: "Chatbot failed" });
  }
};

const getMyContactHistory = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const contacts = await ContactModel.find({
      userId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    res.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Get contact history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact history",
    });
  }
};

module.exports = {
  getData,
  sendOtp,
  forgotPasswordOtpValidation,
  resetPassword,
  resendOtp,
  contactUs,
  campApplication,
  updateHealthStatus,
  getDonorProfile,
  updateProfilePhoto,
  updateProfile,
  uploadDonationProof,
  getAllCamps,
  searchUser,
  deleteAccount,
  deleteProfilePhoto,
  getDonationHistory,
  deleteDonationProof,
  chatbot,
  getMyContactHistory,
  resendRegisterOtp,
};
