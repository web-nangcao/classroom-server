const mongoose = require('mongoose')
const ClassRoom = require('../classroom/ClassRoom')

const ClassroomGradeSchema = mongoose.Schema({
  classroomId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'ClassRoom',
    required: true,
    unique: true,
  },
  grades: [
    {
      type: Object,
    },
  ],
  studentCodes: [
    {
      type: String
    }
  ],
  assignments: [
    {
      assignmentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Assignment',
      },
      is_finallized: {
        type: Boolean,
        default: false,
      },
    },
  ],
}) 


const ClassroomGrade = mongoose.model('ClassroomGrade', ClassroomGradeSchema, 'classroomgrades')

module.exports = ClassroomGrade
