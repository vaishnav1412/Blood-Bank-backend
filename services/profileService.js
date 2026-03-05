const DonerModel = require("../models/donerModel");
const HealthStatusModel = require("../models/HealthStatusModel");
const cloudinary = require("../config/cloudinary-config");

// Get user basic data
const getUserData = async (donorId) => {
  return await DonerModel.findById(donorId).select("-password");
};

// Update health status
const updateHealth = async (donorId, data) => {
  const { weight, platelet, medicalConditions, allergies } = data;

  return await HealthStatusModel.findOneAndUpdate(
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
    }
  );
};

// Delete account
const removeAccount = async (donorId) => {
  return await DonerModel.findByIdAndDelete(donorId);
};

// Delete profile photo
const removeProfilePhoto = async (donorId) => {
  const donor = await DonerModel.findById(donorId);

  if (!donor) {
    throw new Error("Donor not found");
  }

  donor.profilePic = null;
  await donor.save();

  return donor;
};

// Get full donor profile
const getProfile = async (donorId) => {
  const donor = await DonerModel.findById(donorId).select("-password");

  if (!donor) {
    throw new Error("Donor not found");
  }

  const health = await HealthStatusModel.findOne({ _id: donorId });

  return { donor, health };
};

// Upload profile photo
const uploadProfileImage = async (donorId, file) => {
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = "data:" + file.mimetype + ";base64," + b64;

  const publicId = `user_profiles/${donorId}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    folder: "user_profiles",
    transformation: [{ width: 500, height: 500, crop: "fill" }],
  });

  return await DonerModel.findByIdAndUpdate(
    donorId,
    { profilePic: result.secure_url },
    { new: true }
  );
};

// Update profile
const updateDonorProfile = async (donorId, body) => {
  return await DonerModel.findByIdAndUpdate(
    donorId,
    {
      name: body.name,
      gender: body.gender,
      bloodGroup: body.bloodGroup,
      dob: body.dob,
      weight: body.weight,
      platelet: body.platelet,
      donationCount: body.donationCount,
      district: body.district,
      taluk: body.taluk,
      mobile: body.mobile,
      whatsapp: body.whatsapp,
      email: body.email,
      emergencyContact: body.emergencyContact,
    },
    { new: true }
  );
};

module.exports = {
  getUserData,
  updateHealth,
  removeAccount,
  removeProfilePhoto,
  getProfile,
  uploadProfileImage,
  updateDonorProfile,
};