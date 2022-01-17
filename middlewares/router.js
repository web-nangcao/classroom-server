const classroom = require('../components/classroom/classroomControler');
const user = require('../components/user/userControler')
const auth = require('../components/auth/authContronler')
const assignment = require('../components/assignment/assignmentControler')
const classroomGrade = require('../components/classroom-grade/classroomGradeContronler');
const studentReview = require('../components/student-review/studentReviewControler');
const notification = require('../components/notification/notificationController')
const systemAdmin = require('../components/system-admin/systemAdminContronler')

module.exports = function(app) {
    // Nhớ để theo thứ tự này
    app.use('/user', user)
    app.use('/auth', auth)
    app.use('/assignment', assignment)
    app.use('/', classroom)
    app.use('/classroom-grade', classroomGrade)
    app.use('/student-review', studentReview)
    app.use('/notification', notification)
    app.use('/system-admin', systemAdmin)
    // Testing dev
    if (process.env.IS_TESTING == 'true') {
        console.log("Testing environment")
        app.use('/test', require('../components/test/testControler'))
    }
}