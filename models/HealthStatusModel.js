const mongoose = require('mongoose');

const HealthStatusSchema = new mongoose.Schema({
  weight: {
    type: Number, 
    required: false
  },
  platelet: {
    type: String, 
    required: false
  },
  lastHealthCheck: {
    type: Date,
    default: Date.now
  },
  medicalConditions: {
    type: String,
    default: "None"
  },
  allergies: {
    type: String,
    default: "None"
  },
  
}, {
  timestamps: true
});

module.exports = mongoose.model('HealthStatus',HealthStatusSchema );