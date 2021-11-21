const jwt = require('jsonwebtoken')
const ClassRoom = require('../components/classroom/ClassRoom')
const User = require('../components/user/User')

// Issue Token
exports.signToken = (req, res) => {
  const payload = {
    userId: req.user._id,
    userEmail: req.user.email,
  }
  jwt.sign(payload, process.env.MY_SECRET_KEY, { expiresIn: '180 min' }, (err, token) => {
    if (err) {
      res.sendStatus(500)
    } else {
      res.json({ access_token: token })
    }
  })
}

// check if Token exists on request Header and attach token to request as attribute
exports.checkToken = (req, res, next) => {
  // Get auth header value
  const bearerHeader = req.headers['authorization']
  if (typeof bearerHeader !== 'undefined') {
    req.token = bearerHeader.split(' ')[1]

    jwt.verify(req.token, process.env.MY_SECRET_KEY, (err, authData) => {
      if (err) {
        // res.sendStatus(403)
        res.redirect(process.env.GOOGLEAUTH_URL)
      } else {
        req.authData = authData
        next()
      }
    })
  } else {
    // res.sendStatus(403)
    res.redirect(process.env.GOOGLEAUTH_URL)
  }
}

exports.isBelongToClass = async (email, classroomId) => {
  return new Promise(async (resolve, reject) => {
    const user = await User.findOne({ email: email })
    if (user.classrooms.indexOf(classroomId) == -1) {
      resolve(false)
    }
    resolve(true)
  })
}
