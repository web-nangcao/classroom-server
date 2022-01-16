const mongoose = require("mongoose")

const UserSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    default: ''
  },
  googleId: {
    type: String,
    default: ''
  },
  code: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  otpNumber: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isLock: {
    type: Boolean,
    default: false
  },
  classrooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassRoom'
  }]
})

const User = mongoose.model("User", UserSchema, "users")

module.exports = User
