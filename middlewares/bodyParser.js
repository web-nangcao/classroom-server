const bodyParser = require('body-parser')

module.exports = function (app) {
  // parse application/json
  app.use(bodyParser.json())

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }))

}
