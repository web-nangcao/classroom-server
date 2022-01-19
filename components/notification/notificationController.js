const express = require('express')
const router = express.Router()
const authService = require('../../services/authService')
const ClassRoom = require('../classroom/ClassRoom')
const Assginment = require('../assignment/Assignment')
const ClassroomGrade = require('../classroom-grade/ClassroomGrade')
const Assignment = require('../assignment/Assignment')
const User = require('../user/User')
const UserType = require('../user/UserType')
const StudentReview = require('../student-review/StudentReview')
const Notification = require('./Notification')
const NotificationType = require('./NotificationType')

function isAdminOrTeacherOfClass(classroomId, email) {
  return new Promise(async (resolve, reject) => {
    try {
      const classroom = await ClassRoom.findOne({ _id: classroomId })
      if (!classroom) {
        resolve(false)
      }
      classroom.members.forEach((member) => {
        if (
          member.email == email &&
          (member.userType == UserType.ADMIN || member.userType == UserType.TEACHER)
        ) {
          resolve(true)
        }
      })
      resolve(false)
    } catch (error) {
      console.log('error: ', error)
      reject(error)
    }
  })
}

function isBelongToClass(email, classroomId) {
  return new Promise(async (resolve, reject) => {
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

// userId la _id cua nguoi nhan thong bao
// Attribute nao khong can thi de gia tri = null
router.post('/create', authService.checkToken, async (req, res) => {
  const { userId, content, notificationType, classroomId, studentReviewId } = req.body
  try {
    let resValue = null
    if (!content) {
      res.json('Thieu thong tin content')
    } else {
      switch (notificationType) {
        case NotificationType.TEACHER_FINALLIZED_GRADE: {
          const classroom = await ClassRoom.findOne({ _id: classroomId })
          if (!classroom) {
            res.json('classroom khong ton tai')
          } else {
            if (!(await isAdminOrTeacherOfClass(classroomId, req.authData.userEmail))) {
              res.json('May khong co quyen tao thong bao nay')
            } else {
              const classroom_grade = await ClassroomGrade.findOne({ classroomId: classroomId })
              if (!classroom_grade) {
                res.json('chua co diem')
              } else {
                for (let i = 0; i < classroom.members.length; i++) {
                  const user = await User.findOne({email: classroom.members[i].email})
                  if (user && classroom.members[i].userType == 'Student') {
                    const notification = await new Notification({
                      userId: user._id,
                      content: content,
                      notificationType: notificationType,
                      classroomId: classroomId,
                    }).save()
                  }
                }
                resValue = `TEACHER_FINALLIZED_GRADE ${classroomId}`
              }
            }
          }
          break
        }
        case NotificationType.TEACHER_REPLY_REVIEW: {
          const student_review = await StudentReview.findOne({ _id: studentReviewId })
          if (!student_review) {
            res.json('studentReview khong ton tai')
          } else {
            if (
              !(await isAdminOrTeacherOfClass(student_review.classroomId, req.authData.userEmail))
            ) {
              res.json('may khong co quyen tao thong bao nay')
            } else {
              const user = await User.findOne({ _id: userId })
              if (!user) {
                resValue = 'UserId khong ton tai'
              } else {
                const notification = await new Notification({
                  userId: userId,
                  content: content,
                  notificationType: notificationType,
                  studentReviewId: studentReviewId,
                }).save()
                resValue = notification
              }
            }
          }
          break
        }
        case NotificationType.TEACHER_CREATE_UPD_GRADE: {
          const student_review = await StudentReview.findOne({ _id: studentReviewId })
          if (!student_review) {
            res.json('studentReview khong ton tai')
          } else {
            if (
              !(await isAdminOrTeacherOfClass(student_review.classroomId, req.authData.userEmail))
            ) {
              res.json('may khong co quyen tao thong bao nay')
            } else {
              const user = await User.findOne({ _id: userId })
              if (!user) {
                resValue = 'Thieu userId'
              } else {
                const notification = await new Notification({
                  userId: userId,
                  content: content,
                  notificationType: notificationType,
                  studentReviewId: studentReviewId,
                }).save()
                resValue = notification
              }
            }
          }
          break
        }
        case NotificationType.STUDENT_REQUEST_REVIEW: {
          const student_review = await StudentReview.findOne({ _id: studentReviewId })
          if (!student_review) {
            res.json('studentReview khong ton tai')
          } else {
            if (await isAdminOrTeacherOfClass(student_review.classroomId, req.authData.userEmail)) {
              res.json('Chi hoc sinh co quyen tao thong bao nay')
            } else {
              const classroom = await ClassRoom.findOne({_id: student_review.classroomId})
              if (!classroom) {
                res.json('classroomId ko ton tai')
              } else {
                for (let i = 0; i < classroom.members.length; i++) {
                  const user = await ClassRoom.findOne({email: classroom.members[i].email})
                  if (user && (classroom.members[i].userType == 'Teacher' || classroom.members[i].userType =='Admin')) {
                    const notification = await new Notification({
                      userId: user._id,
                      content: content,
                      notificationType: notificationType,
                      studentReviewId: studentReviewId,
                    }).save()
                  }
                }
                resValue = `Student request review ${classroom._id}`
              }
            }
          }
          break
        }
        default: {
          resValue = 'Notification type khong hop le'
          break
        }
      }
    }
    res.json(resValue)
  } catch (error) {
    console.log('error as create-notification', error)
  }
})

router.get('/get-notifications', authService.checkToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.authData.userId.toString() })
      .populate('userId')
      .populate('classroomId')
      .populate('studentReviewId')
    res.json(notifications)
  } catch (error) {
    console.log('error as get-notifications', error)
    res.json(error)
  }
})

module.exports = router
