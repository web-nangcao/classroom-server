const mongoose = require('mongoose')
const ClassRoom = require('../classroom/ClassRoom')
const Assignment = require('../assignment/Assignment')
const User = require('../user/User')

const StudentReviewSchema = mongoose.Schema({
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  code: {
    type: Object,
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
  },
  cur_grade: {
    type: Number,
  },
  exp_grade: {
    type: Number,
  },
  explain: {
    type: String,
  },
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      comment: {
        type: String,
      },
    },
  ],
  is_finallized: {
    type: Boolean,
    default: false,
  },
})

const StudentReview = mongoose.model('StudentReview', StudentReviewSchema, 'studentreviews')

module.exports = StudentReview
