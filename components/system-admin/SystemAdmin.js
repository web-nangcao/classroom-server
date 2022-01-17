const mongoose = require('mongoose')

const SystemAdminSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    requred: true,
  },
  name: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isGod: {
    type: Boolean,
    default: true,
  },
  createdTime: {
    type: Date,
    default: () => Date.now(),
  },
})

const SystemAdmin = mongoose.model('SystemAdmin', SystemAdminSchema, 'systemadmins')
module.exports = SystemAdmin
