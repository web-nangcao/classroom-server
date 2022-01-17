const mongoose = require('mongoose')
const User = require('../user/User')
const ClassRoom = require('../classroom/ClassRoom')
const StudentReview = require('../student-review/StudentReview')
const NotificationType = require('./NotificationType')

const NotificationSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String
    },
    notificationType: {
        type: String
    },
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassRoom'
    }, 
    studentReviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentReview'
    }
})

const Notification = mongoose.model('Notification', NotificationSchema, 'notifications')

module.exports = Notification