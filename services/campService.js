const ApplicationModel = require("../models/bloodDriveModel");

const createCampApplication = async (data) => {
  const applicationId = `BD-${Date.now().toString().slice(-6)}`;

  const newApplication = new ApplicationModel({
    ...data,
    applicationId,
  });

  await newApplication.save();

  return {
    applicationId,
    data: newApplication,
  };
};

const fetchAllCamps = async () => {
  const camps = await ApplicationModel.find()
    .sort({ createdAt: -1 })
    .limit(3);

  return camps;
};

module.exports = {
  createCampApplication,
  fetchAllCamps,
};