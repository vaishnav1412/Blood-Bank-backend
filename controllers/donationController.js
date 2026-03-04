const DonerModel = require("../models/donerModel");
const DonationProof = require("../models/DonationProof");
const cloudinary = require("../config/cloudinary-config");


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






module.exports={
searchUser,
getDonationHistory,
deleteDonationProof,
uploadDonationProof
}