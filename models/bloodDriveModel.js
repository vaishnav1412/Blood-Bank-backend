const mongoose = require('mongoose');

const BloodDriveApplicationSchema = new mongoose.Schema({
  // Step 1: Organization Info
  organizationType: {
    type: String,
    required: [true, 'Organization type is required'],
    enum: ['school', 'college', 'corporate', 'ngo', 'government']
  },
  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person name is required'],
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  alternatePhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },

  // Step 2: Event Details
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  eventTime: {
    type: String,
    required: [true, 'Event time is required']
  },
  duration: {
    type: Number, // Storing as number (e.g., 4)
    required: true
  },
  expectedDonors: {
    type: Number,
    required: [true, 'Expected donor count is required'],
    min: [20, 'Minimum 20 donors required']
  },
  venue: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
  },

  // Step 3: Requirements
  requiredStaff: {
    type: String
  },
  equipment: {
    type: [String], // Array of strings
    default: []
  },
  specialRequirements: {
    type: String,
    trim: true
  },
  previousExperience: {
    type: String,
    enum: ['yes', 'no']
  },

  // Step 4: Additional Info
  targetGroup: {
    type: String,
    enum: ['students', 'staff', 'faculty', 'public']
  },
  awarenessProgram: {
    type: String,
    enum: ['yes', 'no']
  },
  publicitySupport: {
    type: String,
    enum: ['yes', 'no']
  },
  termsAccepted: {
    type: Boolean,
    required: [true, 'You must accept the terms'],
    validate: {
      validator: function(v) {
        return v === true;
      },
      message: 'Terms must be accepted'
    }
  },

  // Admin/Status Fields
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'scheduled'],
    default: 'pending'
  },
  applicationId: {
    type: String,
    unique: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('BloodDriveApplication', BloodDriveApplicationSchema);