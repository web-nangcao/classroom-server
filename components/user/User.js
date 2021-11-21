const mongoose = require("mongoose")

const UserSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  googleId: {
    type: String,
    required: true
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
  classrooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassRoom'
  }]
})


const User = mongoose.model("User", UserSchema, "users")

module.exports = User
