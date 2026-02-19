const DonorModel = require("../models/donerModel")
const CampModel = require("../models/bloodDriveModel")
const ContactModel = require("../models/contactUsModel")
const ProofModel  = require("../models/DonationProof")

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



module.exports ={
    adminLogin,
    getCount,
    getBloodGroupCount,
    getDashboardStats
}