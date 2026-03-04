const DonerModel = require("../models/donerModel");
const HealthStatusModel = require("../models/HealthStatusModel");
const cloudinary = require("../config/cloudinary-config"); 

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

const updateHealthStatus = async (req, res) => {
  try {
    const donorId = req.user.id;

    const { weight, platelet, medicalConditions, allergies } = req.body;

    if (!weight || !platelet) {
      return res.status(400).json({
        success: false,
        message: "Weight and Platelet count are required",
      });
    }

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


module.exports ={
    updateHealthStatus,
    deleteAccount,
    deleteProfilePhoto,
    getDonorProfile,
    updateProfilePhoto,
    updateProfile,
    getData
}