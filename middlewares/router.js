const classroom = require('../components/classroom/classroomControler');
const user = require('../components/user/userControler')

module.exports = function(app) {
    app.use('/', classroom)
    app.use('/user', user)
}