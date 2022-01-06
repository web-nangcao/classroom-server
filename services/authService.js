const jwt = require('jsonwebtoken')
const User = require('../components/user/User')
const ClassRoom = require('../components/classroom/ClassRoom')

// Issue Token
exports.signToken = (req, res) => {
  if (!req.user) {
    return res.status(401).send({ error: 'User was not authenticated' })
  }
  const payload = {
    userId: req.user._id,
    userEmail: req.user.email,
  }
  jwt.sign(payload, process.env.MY_SECRET_KEY, { expiresIn: '300 min' }, (err, token) => {
    if (err) {
      res.sendStatus(500)
    } else {
      console.log(`Verified: ${req.user.email}`)
      res.json({
        user: req.user,
        access_token: token,
      })
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
        res.sendStatus(403)
      } else {
        req.authData = authData
        next()
      }
    })
  } else {
    if (process.env.FONTEND_LOGIN) {
      res.redirect(process.env.FONTEND_LOGIN)
    } else {
      res.sendStatus(403)
    }
  }
}

// exports.isBelongToClass = (email, classroomId) => {
//   return new Promise(async (resolve, reject)=>{
//     try {
//       const user = await User.findOne({ email: email })
//       if (!user) {
//         resolve(false)
//       } else {
//         if (user.classrooms.indexOf(classroomId) == -1) {
//           resolve(false)
//         }
//         resolve(false)
//       }
//     } catch (error) {
//       reject(error)
//     }
//   })
// }



// exports.isAdminOrTeacher = function isAdminOrTeacher(classroomId, email) {
//   return new Promise(async(resolve, reject)=>{
//     try {
//       const classroom = await ClassRoom.findOne({ _id: classroomId })
//       if (!classroom) {
//         resolve(false)
//       }
//       classroom.members.forEach((member) => {
//         console.log(member)
//         console.log(member.email == email)
//         console.log(member.userType == 'Admin')
//         if (member.email == email && ((member.userType == UserType.ADMIN) || (member.userType == UserType.TEACHER))) {
//           resolve(true)
//         }
//       })
//       resolve(false)
//     } catch (error) {
//       console.log('error: ', error)
//       resolve(false)
//     }
//   })

// }
