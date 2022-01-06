const express = require('express')
const router = express.Router()
const ClassRoom = require('./ClassRoom')
const authService = require('../../services/authService')
const mailService = require('../../services/mailService')
const UserType = require('../../components/user/UserType')
const User = require('../user/User')

function isBelongToClass (email, classroomId) {
  return new Promise(async (resolve, reject)=>{
    try {
      const user = await User.findOne({ email: email })
      if (!user) {
        resolve(false)
      } else {
        if (user.classrooms.indexOf(classroomId) == -1) {
          resolve(false)
        }
        resolve(true)
      }
    } catch (error) {
      reject(error)
    }
  })
}

// Get list classes
router.get('/', authService.checkToken, async (req, res) => {
  const errorList = []
  let resValue = null
  try {
    const user = await User.findOne({ email: req.authData.userEmail }).populate('classrooms')

    resValue = {
      classrooms: user.classrooms,
    }
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  } catch (error) {
    console.log('error: ', error)
    errorList.push(error)
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  }
})

// POST -  Create new class
router.post('/create', authService.checkToken, async (req, res) => {
  const { className, topic } = req.body
  const host = req.authData.userEmail
  const errorList = []
  let resValue = null

  try {
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
      errorList.push('Người dùng không tồn tại')
    } else {
      user.classrooms.push(classroom._id)
      await user.save()

      resValue = {
        classroom: classroom,
      }
    }
    console.log('Them lop hoc thanh cong')
    res.json({
      resValue: resValue,
      errorList: errorList,
    })
  } catch (error) {
    console.log('error: ', error)
    errorList.push(error)
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  }
})

// GET - class detail
router.get('/get-class-detail/:classroomId', authService.checkToken, async (req, res) => {
  const email = req.authData.userEmail
  const classroomId = req.params.classroomId
  const errorList = []
  let resValue = null
  try {
    if (!await isBelongToClass(email, classroomId)) {
      errorList.push('Bạn không thể truy cập lớp học này')
    } else {
      const classroom = await ClassRoom.findOne({ _id: classroomId }).populate('assignments')
      if (!classroom) {
        errorList.push('Classroom Id not found')
      } else {
        console.log('Get class detail')
        resValue = {
          classroom: classroom,
        }
      }
    }
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  } catch (error) {
    console.log('error: ', error)
    errorList.push(error)
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  }
})

// Post - Join class by generated link
router.post('/join-class', authService.checkToken, async (req, res) => {
  const { classroomId, userType } = req.body
  const email = req.authData.userEmail

  const errorList = []
  let resValue = null

  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId }).populate('assignments')
    if (!classroom) {
      errorList.push('Lớp học không tồn tại')
    } else {
      const user = await User.findOne({ email: email })
      if (!user) {
        errorList.push('Tài khoản này không tồn tại')
      } else {
        if (await isBelongToClass(user.email, classroom._id)) {
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
  } catch (error) {
    console.log('error: ', error)
    errorList.push(error)
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  }
})

// Get - Join class by gmail
router.get('/join-class-gmail', async (req, res) => {
  const { classroomId, email, userType } = req.query
  const errorList = []
  let resValue = null

  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId }).populate('assignments')
    if (!classroom) {
      errorList.push('Lớp học không tồn tại')
    } else {
      const user = await User.findOne({ email: email })
      if (!user) {
        errorList.push('Tài khoản này không tồn tại')
      } else {
        if (await isBelongToClass(user.email, classroom._id)) {
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
              message: 'Tham gia lớp học thành công, hãy trở về với ClassRoom',
            }
          }
        }
      }
    }
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  } catch (error) {
    console.log('error: ', error)
    errorList.push(error)
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  }
})

// Post - Invite friend by mail
router.post('/invite-gmail', authService.checkToken, async (req, res) => {
  const { classroomId, inviteEmail, userType } = req.body
  const errorList = []
  let resValue = null

  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId }).populate('assignments')
    if (!classroom) {
      errorList.push('Lớp học không tồn tại')
    } else {
      if (!await isBelongToClass(req.authData.userEmail, classroomId)) {
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
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  } catch (error) {
    console.log('error: ', error)
    errorList.push(error)
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  }
})

module.exports = router
