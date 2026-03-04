const campService = require("../services/campService");

const campApplication = async (req, res) => {
  try {
    const data = req.body;

    const result = await campService.createCampApplication(data);

    console.log(
      `New Blood Drive Application: ${result.applicationId} by ${data.organizationName}`
    );

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      applicationId: result.applicationId,
      data: result.data,
    });

  } catch (error) {
    console.error("Blood Drive Submission Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate submission detected. Please try again.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error. Could not submit application.",
    });
  }
};

const getAllCamps = async (req, res) => {
  try {
    const camps = await campService.fetchAllCamps();

    if (!camps || camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No camp requests found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Camp requests fetched successfully",
      total: camps.length,
      camps,
    });

  } catch (error) {
    console.error("Error fetching camps:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching camp requests",
    });
  }
};

module.exports = {
  campApplication,
  getAllCamps,
};