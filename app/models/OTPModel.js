const mongoose = require("mongoose");

// Defining Schema
const OTPSchema = new mongoose.Schema({
  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  otp: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: "5m",
  },
});

// Model
const OTPModel = mongoose.model("EmailVerification", OTPSchema);

module.exports = OTPModel;
