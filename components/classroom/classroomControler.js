const express = require('express')
const router = express.Router()
const ClassRoom = require('./ClassRoom')
const authService = require('../../services/authService')
const mailService = require('../../services/mailService')
const UserType = require('../../components/user/UserType')
const User = require('../user/User')

// Get list classes
// Api endpoint: <HOST>/
// Reqest header: Bearer <access_token>
// Response body:
// -- errorList: []
// -- resValue: []:
// ---- classrooms: []
router.get('/', authService.checkToken, async (req, res) => {
  const errorList = []
  let resValue = null
  const user = await User.findOne({ email: req.authData.userEmail }).populate('classrooms')

  if (!user) {
    resValue = {
      classrooms: [],
    }
  } else {
    resValue = {
      classrooms: user.classrooms,
    }
  }

  res.json({
    errorList: errorList,
    resValue: resValue,
  })
})

// Create new class
// Api endpoint: <HOST>/create
// Request header: Bearer <access_token>
// Request body:
// -- className: str
// -- topic: str
// Response body:
// -- errorList: []
// -- resValue: []:
// ---- classroom: classroom
router.post('/create', authService.checkToken, async (req, res) => {
  const { className, topic } = req.body
  const host = req.authData.userEmail
  const errorList = []
  let resValue = null

  const classroom = await new ClassRoom({
    className: className,
    topic: topic,
    host: host,
    members: [
      {
        email: host,
        userType: UserType.ADMIN,
      },
    ],
  }).save()
  const user = await User.findOne({ email: host })
  if (!user) {
    errorList.push('/Người dùng không tồn tại')
  } else {
    user.classrooms.push(classroom._id)
    user.save()
    console.log('Adding new user')

    resValue = {
      classroom: classroom,
    }
  }
  await res.json({
    resValue: resValue,
    errorList: errorList,
  })
})

// Get class detail
// Api endpoint: <HOST>/
// Reqest header: Bearer <access_token>
// Response body:
// -- errorList: []
// -- resValue: []:
// ---- classrooms: []
router.get('/get-class-detail/:classroomId', authService.checkToken, async (req, res) => {
  console.log('getClass Detail')
  const email = req.authData.userEmail
  const classroomId = req.params.classroomId
  const errorList = []
  let resValue = null
  if (!authService.isBelongToClass(email, classroomId)) {
    errorList.push('Bạn không thể truy cập lớp học này')
  } else {
    const classroom = await ClassRoom.findOne({ _id: classroomId })
    if (!classroom) {
      errorList.push('Classroom Id not found')
    } else {
      console.log('Get class detail')
      resValue = {
        classroom: classroom,
      }
    }
  }
  await res.json({
    errorList: errorList,
    resValue: resValue,
  })
})

// Post - Join class by generated link
// Api endpoint: <HOST>/join-class
// Request header: Bearer <access_token>
// Request body:
// -- classroomId: str
// -- userType: str
// Response body:
// -- errorList: []
// -- resValue: []:
// ---- classroom: classroom
// ---- user: user
router.post('/join-class', authService.checkToken, async (req, res) => {
  const { classroomId, userType } = req.body
  const email = req.authData.userEmail

  const errorList = []
  let resValue = null

  const classroom = await ClassRoom.findOne({ _id: classroomId })
  if (!classroom) {
    errorList.push('Lớp học không tồn tại')
  } else {
    const user = await User.findOne({ email: email })
    if (!user) {
      errorList.push('Tài khoản này không tồn tại')
    } else {
      if (await authService.isBelongToClass(user.email, classroom._id)) {
        errorList.push('Đã tham gia lớp học này rồi')
      } else {
        if (userType != UserType.STUDENT && userType != UserType.TEACHER) {
          errorList.push('UserType không hợp lệ')
        } else {
          console.log(`${email} tham gia lớp học mới`)
          classroom.members.push({
            email: email,
            userType: userType,
          })
          await classroom.save()

          user.classrooms.push(classroom._id)
          await user.save()
          resValue = {
            classroom: classroom,
            user: user,
          }
        }
      }
    }
  }
  res.json({
    errorList: errorList,
    resValue: resValue,
  })
})

// Get - Join class by gmail
// Api endpoint: <HOST>/join-class-gmail?classroomId&email&userType
// Response body:
// -- errorList: []
// -- resValue: []:
// ---- classroom: classroom
// ---- user: user
router.get('/join-class-gmail', async (req, res) => {
  const { classroomId, email, userType } = req.query
  const errorList = []
  let resValue = null

  const classroom = await ClassRoom.findOne({ _id: classroomId })
  if (!classroom) {
    errorList.push('Lớp học không tồn tại')
  } else {
    const user = await User.findOne({ email: email })
    if (!user) {
      errorList.push('Tài khoản này không tồn tại')
    } else {
      if (await authService.isBelongToClass(user.email, classroom._id)) {
        errorList.push('Đã tham gia lớp học này rồi')
      } else {
        if (userType != UserType.STUDENT && userType != UserType.TEACHER) {
          errorList.push('UserType không hợp lệ')
        } else {
          console.log(`${email} tham gia lớp học mới`)
          classroom.members.push({
            email: email,
            userType: userType,
          })
          await classroom.save()

          user.classrooms.push(classroom._id)
          await user.save()
          resValue = {
            message: 'Tham gia lớp học thành công, hãy trở về với ClassRoom'
          }
        }
      }
    }
  }
  res.json({
    errorList: errorList,
    resValue: resValue,
  })
})

// Post - Invite friend by mail
// Api endpoint: <HOST>/invite-gmail
// Request header: Bearer <access_token>
// Request body:
// -- classroomId: str
// -- inviteEmail: str
// -- userType: str
// Response body:
// -- errorList: []
// -- resValue: []:
// ---- message
router.post('/invite-gmail', authService.checkToken, async (req, res) => {
  const { classroomId, inviteEmail, userType } = req.body
  const errorList = []
  let resValue = null
  const classroom = await ClassRoom.findOne({ _id: classroomId })
  if (!classroom) {
    errorList.push('Lớp học không tồn tại')
  } else {
    if (!(await authService.isBelongToClass(req.authData.userEmail, classroomId))) {
      errorList.push('User who create invitation doesnt belong to this class')
    } else {
      const inviteUser = await User.findOne({ email: inviteEmail })
      if (!inviteUser) {
        errorList.push('Invite-User không tồn tại')
      } else {
        if (userType != UserType.STUDENT && userType != UserType.TEACHER) {
          errorList.push('User-Type không hợp lệ')
        } else {
          const inviteLink = `${process.env.HOSTNAME}/join-class-gmail?classroomId=${classroomId}&email=${inviteEmail}&userType=${userType}}`
          const message = await mailService.invite(inviteEmail, inviteLink)
          resValue = {
            message: message,
          }
        }
      }
    }
  }
  await res.json({
    errorList: errorList,
    resValue: resValue,
  })
})

router.post('/remove', async (req, res) => {
  ClassRoom.deleteMany({})
    .then(() => {
      console.log('Classroom remove completed')
      res.send('Classroom remove completed')
    })
    .catch(() => {
      console.log('Something go wrong while deleting classrooms')
      res.send('Something go wrong while deleting classrooms')
    })
})

module.exports = router
