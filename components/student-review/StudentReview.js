const mongoose = require('mongoose')
const ClassRoom = require('../classroom/ClassRoom')
const Assignment = require('../assignment/Assignment')
const User = require('../user/User')

const StudentReviewSchema = mongoose.Schema({
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassRoom',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  upd_grade: {
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
