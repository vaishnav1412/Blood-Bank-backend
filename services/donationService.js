const DonerModel = require("../models/donerModel");
const DonationProof = require("../models/DonationProof");
const cloudinary = require("../config/cloudinary-config");

const searchDonors = async (filters) => {
  return await DonerModel.find(filters);
};

const fetchDonationHistory = async (donorId) => {
  return await DonationProof.find({ donorId }).sort({donationDate:-1});
};

const removeDonationProof = async (donorId, proofId) => {
  const proof = await DonationProof.findById(proofId);

  if (!proof) {
    throw new Error("Donation proof not found");
  }

  if (proof.donorId.toString() !== donorId) {
    throw new Error("Unauthorized action");
  }

  await DonationProof.findByIdAndDelete(proofId);

  return true;
};

const uploadProof = async (donorId, file, body) => {
  const { donationDate, donationCenter, bloodGroup, units } = body;

  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = "data:" + file.mimetype + ";base64," + b64;

  const publicId = `donation_proofs/${donorId}_${Date.now()}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    public_id: publicId,
    folder: "donation_proofs",
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  });

  const newProof = new DonationProof({
    donorId,
    donationDate,
    donationCenter,
    bloodGroup,
    units,
    proofImage: result.secure_url,
    status: "pending",
  });

  return await newProof.save();
};

module.exports = {
  searchDonors,
  fetchDonationHistory,
  removeDonationProof,
  uploadProof,
};