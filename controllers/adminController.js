const DonorModel = require("../models/donerModel");
const CampModel = require("../models/bloodDriveModel");
const ContactModel = require("../models/contactUsModel");
const ProofModel = require("../models/DonationProof");
const GalleryModel = require("../models/galleryModel");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary-config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const {sendReplyEmail } =require("../utilityFunctions/nodeMailer")


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
    const isMatch = await bcrypt.compare(password, user.password);

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
      { expiresIn: "1d" },
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
      responseRate = ((conductedCampCount / totalCampRequests) * 100).toFixed(
        1,
      );
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
    const totalRequests = await ProofModel.countDocuments({
      status: "verified",
    });

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
      .limit(3);

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
      platelet, // Required in schema
      // Fields below are in req.body but NOT in your provided Schema
      // address, pincode, medicalConditions, etc.
    } = req.body;

    console.log(req.body);

    // 1. Validation: Check required fields based on Schema
    if (
      !name ||
      !email ||
      !mobile ||
      !password ||
      !bloodGroup ||
      !platelet ||
      !dob
    ) {
      console.log("working");

      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields (Name, Email, Mobile, Password, Blood Group, Platelet)",
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
          },
        );
        stream.end(req.files.profilePhoto[0].buffer);
      });
      profilePicUrl = result.secure_url;
    }

    // Note: 'idProof' logic was removed as it is not in the provided Schema.
    // If you need it, please add `idProof: String` to your schema.

    // 5. Create Donor
    const newDonor = new DonorModel({
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
      isVerified: true, // Auto verified
      isBlocked: false,
      isAdmin: 0,
    });

    await newDonor.save();

    res.status(201).json({
      success: true,
      message: "Donor added and auto-verified successfully",
      donor: newDonor,
    });
  } catch (error) {
    console.error("Add Donor Error:", error);

    // Handle validation errors specifically
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add donor",
    });
  }
};

const uploadGallery = async (req, res) => {
  try {
    console.log(req.body);

    const {
      title,
      description,
      category,
      type,
      date,
      location,
      featured,
      status,
      tags,
      content,
      author,
    } = req.body;

    if (!title || !type || !category || !date) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    let image = "";
    let videoUrl = "";
    let publicId = "";

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video");

      const uploadFromBuffer = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "blood-bank/gallery",
              resource_type: isVideo ? "video" : "image",
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            },
          );

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      const result = await uploadFromBuffer();

      publicId = result.public_id;

      if (isVideo) {
        videoUrl = result.secure_url;
      } else {
        image = result.secure_url;
      }
    }

    const newItem = new GalleryModel({
      title,
      description,
      category,
      type,
      date,
      location,
      featured: featured === "true",
      status,
      tags: tags ? JSON.parse(tags) : [],
      image,
      videoUrl,
      publicId,
      content,
      author,
    });

    const result = await newItem.save();

    res.status(201).json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAllGallery = async (req, res) => {
  try {
    const items = await GalleryModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateGalleryItem = async (req, res) => {
  console.log("hi");
  
  try {
    const { id } = req.params;
    const existingItem = await GalleryModel.findById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }
    let mediaUrl = existingItem.image || existingItem.videoUrl;
    let publicId = existingItem.publicId;
    if (req.file) {
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: existingItem.type === "video" ? "video" : "image",
        });
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "gallery",
        resource_type: req.body.type === "video" ? "video" : "image",
      });
      mediaUrl = result.secure_url;
      publicId = result.public_id;
    }
    const updatedItem = await GalleryModel.findByIdAndUpdate(
      id,
      {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        type: req.body.type,
        date: req.body.date,
        location: req.body.location,
        tags: JSON.parse(req.body.tags || "[]"),
        content: req.body.content,
        author: req.body.author,
        featured: req.body.featured === "true",
        status: req.body.status,
        image: req.body.type === "photo" ? mediaUrl : undefined,
        videoUrl: req.body.type === "video" ? mediaUrl : undefined,
        publicId,
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};


const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await GalleryModel.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    // Delete media from Cloudinary if exists
    if (item.public_id) {
      await cloudinary.uploader.destroy(item.public_id, {
        resource_type: item.type === "video" ? "video" : "image",
      });
    }

    await GalleryModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAllContactMessages = async (req, res) => {
  try {
    const messages = await ContactModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages",
    });
  }
};

// DELETE multiple contacts
const deleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !ids.length) {
      return res.status(400).json({
        success: false,
        message: "No IDs provided",
      });
    }

    await ContactModel.deleteMany({
      _id: { $in: ids },
    });

    res.status(200).json({
      success: true,
      message: "Messages deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete messages",
    });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["read", "unread"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updated = await ContactModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

const replyToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage || replyMessage.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      });
    }

    const contact = await ContactModel.findById(id);

    if (!contact || contact.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    // ✅ Push reply into array
    contact.replies.push({
      adminId: req.admin.id, // From admin middleware
      replyMessage,
    });

    // ✅ Update ticket state
    contact.replied = true;
    contact.status = "in-progress";
    contact.lastRepliedAt = new Date();

    await contact.save();

    // ✅ Send Email
    await sendReplyEmail(
  contact.email,
  contact.name,
  contact.subject,
  replyMessage
);

    res.json({
      success: true,
      message: "Reply sent successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  adminLogin,
  getCount,
  getBloodGroupCount,
  getDashboardStats,
  getAllUsers,
  blockUser,
  UnBlockUser,
  addDonor,
  uploadGallery,
  getAllGallery,
  updateGalleryItem,
  deleteGalleryItem,
  getAllContactMessages,
  deleteContacts,
  updateContactStatus,
  replyToContact
};
