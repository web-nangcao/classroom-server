const mongoose = require('mongoose')

const ClassroomGradeSchema = mongoose.Schema({
    classroomId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    grades: [{
        type: Object
    }],
    assignments: [{
        assignment: {
            type: String
        }, 
        is_finallized: {
            type: Boolean
        }
    }]
})

const ClassroomGrade = mongoose.model('ClassroomGrade', ClassroomGradeSchema, 'classroomgrades')

module.exports = ClassroomGrade