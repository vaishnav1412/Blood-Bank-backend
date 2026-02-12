const DonerModel = require("../models/donerModel");
const HealthStatusModel =require("../models/HealthStatusModel")
const OTP = require("../models/otpModel");
const ContactModel = require("../models/contactUsModel")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApplicationModel = require("../models/bloodDriveModel")

const {
  sendOtpEmail,
  sendPasswordEmail,
} = require("../utilityFunctions/nodeMailer");

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
      !platelet ||
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

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 3. Check email match
    if (email !== reEmail) {
      return res.status(400).json({ message: "Emails do not match" });
    }

    // 4. Validate mobile numbers
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobile)) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }
    if (!phoneRegex.test(whatsapp)) {
      return res.status(400).json({ message: "Invalid WhatsApp number" });
    }

    // 5. Validate weight
    if (isNaN(weight) || weight < 45) {
      return res.status(400).json({ message: "Weight must be at least 45kg" });
    }

    // 6. Validate donation count
    if (isNaN(donationCount) || donationCount < 0) {
      return res.status(400).json({ message: "Invalid donation count" });
    }

    // 7. Check if user already exists
    const existingDonor = await DonerModel.findOne({ email });
    if (existingDonor) {
      console.log("existing");

      return res
        .status(409)
        .json({ message: "Donor already registered with this email" });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    let purpose = "register";
    await sendOtpEmail(email, otp, purpose);

    // 9. Save donor to DB
    const newDonor = new DonerModel({
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
      otp,
      otpExpires,
    });

    await newDonor.save();
    console.log("registerd ");

    return res.status(200).json({
      message: "OTP sent to email. Please verify to complete registration.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const donorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    // ✅ Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    // 🔍 Check if donor exists
    const donor = await DonerModel.findOne({ email });
    if (!donor) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    console.log("hai..");
    // 🔐 Compare passwords
    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 🎫 Generate JWT
    const token = jwt.sign(
      { id: donor._id, email: donor.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    console.log("token", token);

    // ✅ Success
    return res.status(200).json({
      message: "Login successful",
      token,
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        // add other public fields as needed
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

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

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const donor = await DonerModel.findOne({ email });

    if (!donor) return res.status(404).json({ message: "User not found" });

    // Check if OTP is expired
    if (donor.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Check if OTP matches
    if (donor.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ NEW LOGIC: Generate a random password
    // Generates a password like "Life4829" (Easy to type/read)
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedPassword = `Life${randomPart}`;

    // ✅ Hash the password before saving (Security Best Practice)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    // ✅ Send the password email (Must send PLAINTEXT password)
    await sendPasswordEmail(email, generatedPassword);

    // ✅ Update User Data
    donor.otp = null;
    donor.otpExpires = null;
    donor.isVerified = true;
    donor.password = hashedPassword; // Save the HASHED version

    await donor.save();

    return res.json({
      message: "Email verified successfully. Password sent to your email.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error during verification" });
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
  console.log(email,otp);
  
  try {
   const otpRecord = await OTP.findOne({
      email: email,
      otp: otp,
      purpose: "password_reset",
      isUsed: false, 
      expiresAt: { $gt: new Date() }, // ✅ Correct MongoDB syntax
    });

    console.log(otpRecord,"hhhh");
    

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }
console.log("close");

    // Mark OTP as used
   otpRecord.isUsed = true; // Update the data in memory
await otpRecord.save();  // Commit to database (triggers validation/hooks)

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

const resetPassword = async(req,res) =>{
  console.log("loading....");

   const {email, newPassword, otp } = req.body;

   console.log(req.body);
   

  try {
    // 1. Validation
    if ( !email || !newPassword || !otp) {
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
    await DonerModel.updateOne({email}, {$set:{
      password: hashedPassword,
    }});

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
  
}

const resendOtp = async(req,res)=>{
 const { email } = req.body;

  try {
    // 1. Check if user exists
    const user = await DonerModel.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Email not found. Please check and try again." 
      });
    }
    
    // 2. Check rate limiting - prevent OTP flooding (Last 5 minutes)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentOTPs = await OTP.find({
      email: email,
      purpose: 'password_reset',
      createdAt: { $gt: fiveMinsAgo } // ✅ Mongoose syntax uses $gt
    });
    
    // Limit to 3 resends in 5 minutes
    if (recentOTPs.length >= 3) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please wait 5 minutes before trying again."
      });
    }
    
    // 3. Check last OTP sent time (minimum 30 seconds gap)
    // Sort by createdAt descending to get the latest one
    const lastOTP = await OTP.findOne({
      email: email,
      purpose: 'password_reset'
    }).sort({ createdAt: -1 });
    
    if (lastOTP) {
      // Calculate time difference in milliseconds
      const timeSinceLastOTP = Date.now() - lastOTP.createdAt.getTime();
      
      if (timeSinceLastOTP < 30000) { // 30 seconds
        const waitTime = Math.ceil((30000 - timeSinceLastOTP) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP.`
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
      purpose: 'password_reset',
      expiresAt: expiresAt,
      isResend: true,
      resendCount: recentOTPs.length + 1
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
      resendCount: recentOTPs.length + 1
    });
    
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
  
  
}

const contactUs = async(req,res) =>{
 try {
    // 1. Destructure data from request body
    const { name, email, phone, subject, message } = req.body;

    // 2. Basic Server-Side Validation (Optional but recommended)
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // 3. Create a new contact document
    const newContact = new ContactModel({
      name,
      email,
      phone,
      subject,
      message
    });

    // 4. Save to Database
    await newContact.save();

    console.log(`New submission from ${name}:`, email);

    // 5. Send Success Response
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newContact
    });

    // OPTIONAL: Send Email Logic here using Nodemailer
    // await sendEmail({ email, subject, message }); 

  } catch (error) {
    console.error('Contact Form Error:', error);

    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle General Errors
    res.status(500).json({
      success: false,
      message: 'Server Error. Could not submit form.'
    });
  }
  
}

const campApplication = async(req,res)=>{
   try {
    // 1. Extract data from request body
    const data = req.body;

    // 2. Generate a custom Application ID (e.g., BD-849302)
    // We match the logic used in the frontend for consistency
    const applicationId = `BD-${Date.now().toString().slice(-6)}`;

    // 3. Create new application instance
    const newApplication = new ApplicationModel({
      ...data,
      applicationId: applicationId
    });

    // 4. Save to Database
    await newApplication.save();

    console.log(`New Blood Drive Application: ${applicationId} by ${data.organizationName}`);

    // 5. Send Success Response
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: applicationId,
      data: newApplication
    });

  } catch (error) {
    console.error('Blood Drive Submission Error:', error);

    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle Duplicate Key Errors (e.g., same Application ID generated twice)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate submission detected. Please try again.'
      });
    }

    // Handle General Server Errors
    res.status(500).json({
      success: false,
      message: 'Server Error. Could not submit application.'
    });
  }
  
}

const updateHealthStatus =async(req,res)=>{
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
        message: "Weight and Platelet count are required" 
      });
    }


    // 4. Update the Donor
    // { new: true } ensures we get the updated document back
    const healthData = await HealthStatusModel.findOneAndUpdate(
      {_id: donorId }, 
      {
        weight,
        platelet,
        lastHealthCheck: Date.now(),
        medicalConditions: medicalConditions || "None",
        allergies: allergies || "None"
      }, 
      { 
        upsert: true, 
        new: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    );

    if (!healthData) {
      return res.status(404).json({ message: "Donor not found" });
    }

    // 5. Send Response
    res.status(200).json({
      success: true,
      message: "Health status updated successfully",
      donor: healthData
    });

  } catch (error) {
    console.error("Health Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
  
  
}

const getDonorProfile = async (req, res) => {
  console.log('pppp');
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
    const health = await HealthStatusModel.findOne({ _id:donorId });

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

module.exports = {
  donorLogin,
  donerRegistration,
  getData,
  verifyOtp,
  sendOtp,
  forgotPasswordOtpValidation,
  resetPassword,
  resendOtp,
  contactUs,
  campApplication,
  updateHealthStatus,
  getDonorProfile,
};
