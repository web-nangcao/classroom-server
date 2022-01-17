const express = require('express')
const router = express.Router()
const authService = require('../../services/authService')
const ClassRoom = require('../classroom/ClassRoom')
const Assginment = require('../assignment/Assignment')
const ClassroomGrade = require('../classroom-grade/ClassroomGrade')
const Assignment = require('../assignment/Assignment')
const User = require('../user/User')
const UserType = require('../user/UserType')
const StudentReview = require('./StudentReview')

async function getStudentCodeByEmail(classroomId, email) {
  return new Promise(async (resolve, reject) => {
    const classroom = await ClassRoom.findOne({ _id: classroomId })
    if (!classroom) {
      reject(new Error('Lop hoc khong ton tai'))
    } else {
      const user = await User.findOne({ email: email })
      if (user.classrooms.indexOf(classroomId) == -1) {
        reject(new Error('Hoc sinh chua tham gia lop hoc nay'))
      } else {
        classroom.members.forEach((member) => {
          if (member.email == email) {
            resolve(member.code)
          }
        })
        reject(null)
      }
    }
  })
}

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

// Student create review
router.post('/student-create-review', authService.checkToken, async (req, res) => {
  const { classroomId, assignmentId, cur_grade, exp_grade, explain } = req.body
  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId })
    if (!classroom) {
      res.json('classroom khong ton tai')
    } else {
      const assignment = await Assignment.findOne({ _id: assignmentId })
      if (!assignment) {
        res.json('assignment khong ton tai')
      } else {
        if (classroom.assignments.indexOf(assignmentId) == -1) {
          res.json('assignment khong thuoc lop nay')
        } else {
          if (await isAdminOrTeacherOfClass(classroomId, req.authData.userEmail)) {
            res.json('Khong phai student khong tao review duoc')
          } else {
            const student_review = await new StudentReview({
              classroomId: classroomId,
              studentId: req.authData.userId,
              assignmentId: assignmentId,
              cur_grade: cur_grade,
              exp_grade: exp_grade,
              explain: explain,
            }).save()
            console.log('Student create reivew')
            res.json(student_review)
          }
        }
      }
    }
  } catch (error) {
    console.log('error as student-create-review: ', error)
    res.json(error)
  }
})

// Student get reviews
router.get('/student-get-reviews/:classroomId', authService.checkToken, async (req, res) => {
  const { classroomId } = req.params
  try {
    const classroom = await ClassRoom.findOne({ classroomId: classroomId })
    if (!classroom) {
      res.json('Classroom khong ton tai')
    } else {
      if (!(await isBelongToClass(req.authData.userEmail, classroomId))) {
        res.json('May khong thuoc lop hoc nay')
      } else {
        const student_reviews = await StudentReview.find({
          classroomId: classroomId,
          studentId: req.authData.userId,
        })
          .populate('classroomId')
          .populate('studentId')
          .populate('assignmentId')
          .populate('comments.user')
        console.log('Student get reviews')
        res.json(student_reviews)
      }
    }
  } catch (error) {
    console.log('error as student-get-reviews', error)
    res.json(error)
  }
})

// Teacher get reviews
router.get('/teacher-get-reviews/:classroomId', authService.checkToken, async (req, res) => {
  const { classroomId } = req.params
  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId })
    if (!classroom) {
      res.json('Lop hoc khong ton tai')
    } else {
      if (!(await isAdminOrTeacherOfClass(classroomId, req.authData.userEmail))) {
        res.json('May khong co quyen xem')
      } else {
        const student_reviews = await StudentReview.find({ classroomId: classroomId })
          .populate('classroomId')
          .populate('studentId')
          .populate('assignmentId')
          .populate('comments.user')
        res.json(student_reviews)
      }
    }
  } catch (error) {
    console.log('error as teacher-get-reviews', error)
    res.json(error)
  }
})

// Comment to review
router.post('/comment-review', authService.checkToken, async (req, res) => {
  const { studentReviewId, comment } = req.body
  try {
    const student_review = await StudentReview.findOne({ _id: studentReviewId })
    if (!student_review) {
      res.json('StudentReview khong ton tai')
    } else {
      if (!(await isBelongToClass(req.authData.userEmail, student_review.classroomId))) {
        res.json('May khong thuoc lop hoc nay')
      } else {
        if (
          !(await isAdminOrTeacherOfClass(
            student_review.classroomId.toString(),
            req.authData.userEmail
          )) &&
          student_review.studentId.toString() != req.authData.userId
        ) {
          res.json('May khong co quyen comment review nay')
        } else {
          const user = await User.findOne({ email: req.authData.userEmail })

          const new_comment = {
            user: user._id,
            comment: comment,
          }
          student_review.comments.push(new_comment)
          await student_review.save()
          
          const resValue = await StudentReview.findOne({ _id: student_review._id })
            .populate('classroomId')
            .populate('studentId')
            .populate('assignmentId')
            .populate('comments.user')
          res.json(resValue)
        }
      }
    }
  } catch (error) {
    console.log('error as comment-review', error)
    res.json(error)
  }
})

// Teacher mark review as finallized
router.post('/mark-finallized', authService.checkToken, async (req, res) => {
  const { studentReviewId, is_finallized, upd_grade } = req.body
  try {
    const student_review = await StudentReview.findOne({ _id: studentReviewId })
    if (!student_review) {
      res.json('student review khong ton tai')
    } else {
      if (!(await isAdminOrTeacherOfClass(student_review.classroomId, req.authData.userEmail))) {
        res.json('May khong co quyen lam dieu nay')
      } else {
        student_review.is_finallized = is_finallized
        student_review.upd_grade = upd_grade
        await student_review.save()
        console.log('teacher mark student_review')
        res.json(student_review)
      }
    }
  } catch (error) {
    console.log('error as mark-review-finallized')
    res.json(error)
  }
})

module.exports = router
