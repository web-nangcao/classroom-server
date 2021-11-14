const cookieParser = require('cookie-parser');
const logger = require('morgan');

module.exports = function (app) {
    app.use(logger('dev'));

    app.use(cookieParser());
}