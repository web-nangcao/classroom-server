const classroom = require('../components/classroom/classroomControler');
const user = require('../components/user/userControler')
const auth = require('../components/auth/authContronler')

module.exports = function(app) {
    // Nhớ để theo thứ tự này
    app.use('/user', user)
    app.use('/auth', auth)
    app.use('/', classroom)
}