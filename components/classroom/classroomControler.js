const express = require('express')
const router = express.Router()
const ClassRoom = require('./ClassRoom')
const authService = require('../../services/authService')
const mailService = require('../../services/mailService')
const UserType = require('../../components/user/UserType')
const User = require('../user/User')



// Get list class
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

// Join class
router.get('/join-class/:classroomId/:userType', authService.checkToken, async (req, res) => {
  const classroomId = req.params.classroomId
  const userType = req.params.userType
  const email = req.authData.userEmail
  const errorList = []
  let resValue = null

  const user = await User.findOne({ email: email }).populate('classrooms')
  if (!user) {
    errorList.push('Email không hợp lệ')
  } else {
    if (await authService.isBelongToClass(user.email, classroomId)) {
      errorList.push('Đã tham gia lớp học này rồi')
    } else {
      const classroom = await ClassRoom.findOne({ _id: classroomId })
      if (!classroom) {
        errorList.push('Lớp học không tồn tại')
      } 
      else {
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
  await res.json({
    resValue: resValue,
    errorList: errorList,
  })
})

// Create invite link
router.get(
  '/create-invite-link/:classroomId/:userType',
  authService.checkToken,
  async (req, res) => {
    const classroomId = req.params.classroomId
    const userType = req.params.userType
    const errorList = []
    let resValue = null
    await ClassRoom.findOne({ _id: classroomId })
      .then((classroom) => {
        if (classroom != null) {
          console.log('create invite link')
          resValue = {
            inviteLink: `${process.env.HOSTNAME}/join-class/${classroom._id}/${userType}`,
          }
        } else {
          errorList.push('Classroom Id not found')
        }
      })
      .catch((err) => {
        console.error(err)
        errorList.push(err)
      })
    await res.json({
      errorList: errorList,
      resValue: resValue,
    })
  }
)

// Invite friend
router.post('/invite/:classroomId/:userType', authService.checkToken, async (req, res) => {
  const { emails } = req.body
  console.log('invite to emails: ', emails)
  const classroomId = req.params.classroomId
  const userType = req.params.userType
  const errorList = []
  let resValue = null

  const classroom = await ClassRoom.findOne({ _id: classroomId })
  if (!classroom) {
    errorList.push('Lớp học không tồn tại')
  } else {
    if (!(await authService.isBelongToClass(req.authData.userEmail, classroomId))) {
      errorList.push('User who create invitation doesnt belong to this class')
    } else {
      const inviteLink = `${process.env.HOSTNAME}/join-class/${classroomId}/${userType}`
      const message = await mailService.invite(emails, inviteLink)
      resValue = {
        message: message,
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
