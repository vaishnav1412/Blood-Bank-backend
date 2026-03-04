const donationService = require("../services/donationService");

const searchUser = async (req, res) => {
  try {
    const { district, taluk, bloodGroup } = req.query;

    const filter = {};
    if (district) filter.district = district;
    if (taluk) filter.taluk = taluk;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const donors = await donationService.searchDonors(filter);

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

    const history = await donationService.fetchDonationHistory(donorId);

    res.status(200).json({
      message: "Donation history fetched successfully",
      history: history || [],
    });

  } catch (error) {
    console.error("Fetch Donation History Error:", error);

    res.status(500).json({
      message: "Server error while fetching donation history",
    });
  }
};

const deleteDonationProof = async (req, res) => {
  try {
    const donorId = req.user.id;
    const proofId = req.params.id;

    await donationService.removeDonationProof(donorId, proofId);

    res.status(200).json({
      message: "Donation proof deleted successfully!",
    });

  } catch (error) {
    console.error("Delete Proof Error:", error);

    if (error.message === "Donation proof not found") {
      return res.status(404).json({ message: error.message });
    }

    if (error.message === "Unauthorized action") {
      return res.status(403).json({ message: error.message });
    }

    res.status(500).json({
      message: "Server error while deleting donation proof",
    });
  }
};

const uploadDonationProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const donorId = req.user.id;

    const proof = await donationService.uploadProof(
      donorId,
      req.file,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Donation proof uploaded successfully!",
      proof,
    });

  } catch (error) {
    console.error("Donation Upload Error:", error);

    res.status(500).json({
      message: "Error uploading donation proof",
    });
  }
};

module.exports = {
  searchUser,
  getDonationHistory,
  deleteDonationProof,
  uploadDonationProof,
};