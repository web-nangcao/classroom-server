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
  assignments: [
    {
      name: {
        type: String,
      },
      is_finallized: {
        type: Boolean,
      },
    },
  ],
}) 


const ClassroomGrade = mongoose.model('ClassroomGrade', ClassroomGradeSchema, 'classroomgrades')

module.exports = ClassroomGrade
