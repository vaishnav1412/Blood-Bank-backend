const DonorModel = require("../models/donerModel")
const CampModel = require("../models/bloodDriveModel")
const ContactModel = require("../models/contactUsModel")
const ProofModel  = require("../models/DonationProof")
const cloudinary = require("../config/cloudinary-config") ;
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
    const user = await DonorModel.findOne({ email });

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

    console.log(token);
    

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


const getCount = async (req, res) => {
  try {
    // ✅ Total Active Verified Donors
    const activeDoners = await DonorModel.countDocuments({
      isVerified: true,
    });

    // ✅ Total Verified Donations Proofs
    const numberOfDonations = await ProofModel.countDocuments({
      status: "verified",
    });

    // ✅ Total Approved / Conducted Camps
    const conductedCampCount = await CampModel.countDocuments({
      status: "approved",
    });

    // ✅ Total Camp Requests (All)
    const totalCampRequests = await CampModel.countDocuments();

    // ✅ Pending Camp Requests
    const pendingCampRequests = await CampModel.countDocuments({
      status: "pending",
    });

    // ✅ Response Rate Calculation
    // Response Rate = Approved Camps / Total Requests * 100

    let responseRate = 0;

    if (totalCampRequests > 0) {
      responseRate = ((conductedCampCount / totalCampRequests) * 100).toFixed(1);
    }

    // ✅ Send Response
    res.status(200).json({
      success: true,
      stats: {
        activeDoners,
        numberOfDonations,
        conductedCampCount,
        totalCampRequests,
        pendingCampRequests,
        responseRate: `${responseRate}%`,
      },
    });
  } catch (error) {
    console.error("Dashboard Count Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};
const getBloodGroupCount = async (req, res) => {
  try {
    const bloodGroupStats = await DonorModel.aggregate([
      {
        $match: { isVerified: true }, // only verified donors
      },
      {
        $group: {
          _id: "$bloodGroup", // group by blood group
          count: { $sum: 1 }, // count donors
        },
      },
      {
        $sort: { _id: 1 }, // sort A+, A-, B+...
      },
    ]);

    res.status(200).json({
      success: true,
      stats: bloodGroupStats,
    });
  } catch (error) {
    console.error("Blood Group Count Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch blood group count",
    });
  }
};

// for dashboard datas

const getDashboardStats = async (req, res) => {
  try {
    // ✅ Total Verified Donors
    const totalDonors = await DonorModel.countDocuments({
      isVerified: true,
    });

    // ✅ Total Blood Requests
    const totalRequests = await ProofModel.countDocuments({status:"verified"});

    // ✅ Active Camps (Approved + Upcoming)
    const activeCamps = await CampModel.countDocuments({
      status: "approved",
    });

    // ✅ Verified Donations (Lives Saved Estimate)
    const verifiedDonations = await ProofModel.countDocuments({
      status: "verified",
    });

    // Each donation saves ~3 lives
    const livesSaved = verifiedDonations * 3;

    // ✅ Recent Activities (Last 5 Donors)
    const recentDonors = await DonorModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name bloodGroup createdAt");

    const recentActivities = recentDonors.map((donor) => ({
      action: "New donor registered",
      user: `${donor.name} (${donor.bloodGroup})`,
      time: donor.createdAt,
    }));

    // ✅ Upcoming Camps (Next 3 Camps)
    const upcomingCamps = await CampModel.find({
      status: "scheduled",
      eventDate: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .limit(3)
      
      console.log(upcomingCamps);
      

    return res.status(200).json({
      success: true,
      stats: {
        totalDonors,
        totalRequests,
        activeCamps,
        livesSaved,
      },
      recentActivities,
      upcomingCamps,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard stats",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { search = "", tab = "all", page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    let query = {};

    // 🔍 Search logic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { bloodGroup: { $regex: search, $options: "i" } },
      ];
    }

    // 📌 Tab filtering
    if (tab === "active") query.isVerified = true;
    if (tab === "pending") query.isVerified = false;
    if (tab === "blocked") query.isBlocked = true;

    // 🔢 Get total count first
    const totalUsers = await DonorModel.countDocuments(query);

    // 📄 Get paginated users
    const users = await DonorModel.find(query)
      .select("-password -otp -otpExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limitNumber),
      currentPage: pageNumber,
    });

  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId, blockReason } = req.body;

    const user = await DonorModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isBlocked = true;
    user.blockReason = blockReason || "Admin action";
    user.blockedAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });

  } catch (error) {
    console.error("Block error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to block user",
    });
  }
};


const UnBlockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await DonorModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isBlocked = false;
    

    await user.save();

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });

  } catch (error) {
    console.error("Unblock error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to Unblock user",
    });
  }
};



const addDonor = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      dob,
      donationCount,
      password,
      whatsapp,
         // Mapped to 'dob' in schema
      gender,
      district,
      taluk,
      bloodGroup,
      weight,
      latestDonatedDate, // Mapped to 'latestDonatedDate' in schema
      platelet,       // Required in schema
      // Fields below are in req.body but NOT in your provided Schema
      // address, pincode, medicalConditions, etc.
    } = req.body;

    console.log(req.body);
    

    // 1. Validation: Check required fields based on Schema
    if (!name || !email || !mobile || !password || !bloodGroup || !platelet||!dob) {
     console.log("working");
     
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (Name, Email, Mobile, Password, Blood Group, Platelet)",
      });
    }

    // 2. Check duplicate email
    const existingDonor = await DonorModel.findOne({ email });
    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Upload Profile Photo to Cloudinary
    // Note: Your schema has 'profilePic', but input uses 'profilePhoto'
    let profilePicUrl = "";
    if (req.files?.profilePhoto) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "bloodbank/profilePhotos" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.files.profilePhoto[0].buffer);
      });
      profilePicUrl = result.secure_url;
    }
    
    // Note: 'idProof' logic was removed as it is not in the provided Schema.
    // If you need it, please add `idProof: String` to your schema.

    // 5. Create Donor
    const newDonor =  new DonorModel({
      // Map request body to Schema fields
      name,
      email,
      mobile,
      whatsapp,
      
      password: hashedPassword,
      
      // Mapping specific names
      dob, 
      latestDonatedDate,
      profilePic: profilePicUrl,

      // Other required schema fields
      gender,
      district,
      taluk,
      bloodGroup,
      weight,
      platelet,

      // Logic fields
      donationCount: 0, // Schema requires this, default 0 for new donor
      level: "New Donor", // Default defined in schema, but explicit here
      
      // Status fields
      isVerified: true,  // Auto verified
      isBlocked: false,
      isAdmin: 0
    });

    await newDonor.save()

    res.status(201).json({
      success: true,
      message: "Donor added and auto-verified successfully",
      donor: newDonor,
    });

  } catch (error) {
    console.error("Add Donor Error:", error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add donor",
    });
  }
};




module.exports ={
    adminLogin,
    getCount,
    getBloodGroupCount,
    getDashboardStats,
    getAllUsers,
    blockUser,
    UnBlockUser,
    addDonor
    
}