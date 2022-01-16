const express = require('express')
const router = express.Router()
const ClassRoom = require('./ClassRoom')
const authService = require('../../services/authService')
const mailService = require('../../services/mailService')
const UserType = require('../../components/user/UserType')
const User = require('../user/User')
const ClassroomGrade = require('../classroom-grade/ClassroomGrade')

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

function isCodeAvailable(classroomId, code, email) {
  return new Promise(async (resolve, reject)=>{
    try {
      const classroom = await ClassRoom.findOne({_id: classroomId})
      classroom.members.forEach(member => {
        if (member.code == code && member.email != email) {
          resolve(false)
        }
      });
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}

function assignCode(classroomId, code, email) {
  return new Promise(async (resolve, reject)=>{
    try {
      const classroom = await ClassRoom.findOne({_id: classroomId})
      for(let i = 0; i < classroom.members.length; i++) {
        if(classroom.members[i]['email'] == email) {
          classroom.members[i]['code'] = code
          break;
        }
      }
      await classroom.save()
      resolve(classroom)
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

      console.log('Them lop hoc thanh cong')
      resValue = {
        classroom: classroom,
      }
    }
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

// Join class by code
router.post('/join-class-code', authService.checkToken, async(req, res)=>{
  const {code} = req.body
  console.log(req.authData)
  console.log(code)
  try {
    const classroom = await ClassRoom.findOne({_id: code})
    if (!classroom) {
      res.json("Classroom khong ton tai")
    } else {
      if (await isBelongToClass(req.authData.userEmail, code)) {
        res.json('Da tham gia lop hoc nay roi')
      } else {
        classroom.members.push({
          email: req.authData.userEmail,
          userType: UserType.STUDENT
        })
        await classroom.save()

        const user = await User.findOne({email: req.authData.userEmail})
        user.classrooms.push(classroom._id)
        await user.save()

        res.json({
          classroom: classroom,
          user: user,
          message: 'Tham gia lop hoc thanh cong'
        })
      }
    }
  } catch (error) {
    console.log('Error as join-class-code', error)
    res.json(error)
  }
})

// Mapping student code
router.post('/mapping-student-code', authService.checkToken, async(req, res)=>{
  const {code, classroomId} = req.body
  try {
    const classroom = await ClassRoom.findOne({classroomId})
    if (!classroom) {
      res.json("Lop hop khong ton tai")
    } else {
      const classroom_grade = await ClassroomGrade.findOne({classroomId: classroomId})
      if (!classroom_grade || classroom_grade.studentCodes.indexOf(code) == -1) {
        res.json('Khong ton tai mssv nay')
      } else {
        if (!await isCodeAvailable(classroomId, code, req.authData.userEmail)) {
          res.json('Code nay da duoc su dung roi hihi')
        } else {
          // Classroom da duoc update trong assignCode
          const new_classroom = await assignCode(classroomId, code, req.authData.userEmail)
          res.json({
            classroom: new_classroom,
            message: 'Mapping mssv thanh cong'
          })
        }
      }
    }
  } catch (error) {
    console.log('Error as mapping-student-code', error)
    res.json(error)
  }
})

module.exports = router
