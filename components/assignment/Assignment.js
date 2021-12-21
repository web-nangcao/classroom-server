const mongoose = require('mongoose')
const ClassRoom = require('../classroom/ClassRoom')
const User = require('../user/User')
const UserType = require('../user/UserType')
const authService = require('../../services/authService')

const AssignmentSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  point: {
    type: Number,
  },
  email: {
    type: String,
    required: true,
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
  },
})



const Assignment = mongoose.model('Assignment', AssignmentSchema, 'assignments')

module.exports = Assignment
