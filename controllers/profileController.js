const profileService = require("../services/profileService");

const getData = async (req, res) => {
  try {
    const userData = await profileService.getUserData(req.user.id);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: userData });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateHealthStatus = async (req, res) => {
  try {
    const donorId = req.user.id;

    const { weight, platelet } = req.body;

    if (!weight || !platelet) {
      return res.status(400).json({
        success: false,
        message: "Weight and Platelet count are required",
      });
    }

    const healthData = await profileService.updateHealth(donorId, req.body);

    res.status(200).json({
      success: true,
      message: "Health status updated successfully",
      donor: healthData,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await profileService.removeAccount(req.user.id);

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
    const donor = await profileService.removeProfilePhoto(req.user.id);

    res.status(200).json({
      message: "Profile photo removed successfully",
      donor,
    });

  } catch (error) {
    if (error.message === "Donor not found") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({
      message: "Server error while deleting profile photo",
    });
  }
};

const getDonorProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      donor: profile.donor,
      health: profile.health || null,
    });

  } catch (error) {
    if (error.message === "Donor not found") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({
      message: "Server error while fetching profile",
    });
  }
};

const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await profileService.uploadProfileImage(req.user.id, req.file);

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: "Error uploading photo" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const donor = await profileService.updateDonorProfile(req.user.id, req.body);

    res.status(200).json({
      message: "Profile updated successfully",
      donor,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  updateHealthStatus,
  deleteAccount,
  deleteProfilePhoto,
  getDonorProfile,
  updateProfilePhoto,
  updateProfile,
  getData,
};