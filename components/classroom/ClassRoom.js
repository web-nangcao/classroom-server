const mongoose = require('mongoose')
const User = require('../user/User')
const Assignment = require('../assignment/Assignment')

const ClassroomSchema = mongoose.Schema({
  className: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  host: {
    type: String,
    required: true,
  },
  members: [
    {
      email: {
        type: String,
      },
      userType: {
        type: String,
      }, 
      code: {
        type: String,
        default: ''
      }
    },
  ],
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
  }]
})

const ClassRoom = mongoose.model('ClassRoom', ClassroomSchema, 'classrooms')

module.exports = ClassRoom
