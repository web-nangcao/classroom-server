const mongoose = require("mongoose")

const UserSchema = mongoose.Schema({
  gmail: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  otpNumber: {
    type: String,
  }
})

const User = mongoose.model("User", UserSchema, "users")

module.exports = User
