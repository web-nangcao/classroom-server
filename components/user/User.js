const mongoose = require("mongoose")

const bcrypt = require('bcrypt')

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
  }
})

// UserSchema.pre('save', async (next)=>{
//   const user = this;
//   const hash = bcrypt.hash(user.password, 10)

//   user.password = hash
//   next()
// })

// UserSchema.method.comparePassword = async(password)=>{
//   const user = this
//   const compare = await bcrypt.compare(password, user.password)

//   return compare
// }

const User = mongoose.model("User", UserSchema, "users")

module.exports = User
