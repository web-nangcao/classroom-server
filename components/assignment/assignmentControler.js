const express = require('express')

const router = express.Router()
const authService = require('../../services/authService')
const ClassRoom = require('../classroom/ClassRoom')
const Assignment = require('./Assignment')
const User = require('../user/User')
const UserType = require('../user/UserType')

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

function isAdminOrTeacher(classroomId, email) {
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
      resolve(false)
    }
  })
}

// GET get assignment detail
router.get('/get-detail/:assignmentId', authService.checkToken, async (req, res, next) => {
  const assignmentId = req.params.assignmentId
  const errorList = []
  let resValue = null
  try {
    const assignment = await Assignment.findOne({ _id: assignmentId })
    if (!assignment) {
      errorList.push('Assignment ID khong ton tai')
    } else {
      if (!(await isBelongToClass(req.authData.userEmail, assignment.classroomId))) {
        errorList.push('May khong co quyen xem assignment nay')
      } else {
        resValue = assignment
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

// POST assignments list by classroomId
// Api endpoint: <HOST>/assignment/get-list
// Request header: Bearer <access_token>
// Request body: {
//     classroomId: classroomId
// }
// Response body: {
//     errorList: [],
//     resValue: {
//         assignments: [{
//             assignment: assignment
//         }]
//     }
// }
router.post('/get-list', authService.checkToken, async (req, res, next) => {
  const { classroomId } = req.body
  const errorList = []
  let resValue = null
  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId }).populate('assignments')
    if (!classroom) {
      errorList.push('Classroom ID khong ton tai')
    } else {
      resValue = classroom.assignments
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

// Post UpSert assignment
router.post('/update', authService.checkToken, async (req, res) => {
  const { classroomId, assignments } = req.body
  const errorList = []
  let resValue = null
  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId })
    if (!classroom) {
      errorList.push('ClassroomID khong ton tai')
    } else {
      if (!(await isAdminOrTeacher(classroomId, req.authData.userEmail))) {
        errorList.push('Ban khong co quyen cap nhat assignment')
      } else {
        const tmp_assignments = {}
        let flag = false
        for (let i = 0; i < assignments.length; i++) {
          if (tmp_assignments[`${assignments[i].name}`] == undefined) {
            tmp_assignments[`${assignments[i].name}`] = 1
          } else {
            flag = true
          }
        }
        if (flag == true) {
          res.json('Khong duoc dat assignment trung ten')
        } else {
          await Assignment.deleteMany({ classroomId: classroomId })
          console.log('assignments: ', assignments)
          const new_assignments = []
          // Insert new assignment
          for (let i = 0; i < assignments.length; i++) {
            const new_assignment = await new Assignment({
              name: assignments[i].name,
              point: assignments[i].point,
              email: req.authData.userEmail,
              classroomId: classroom._id,
            }).save()
            console.log('assignment: ', new_assignment)
            new_assignments.push(new_assignment._id)
          }
          classroom.assignments = new_assignments
          resValue = await classroom.save()
          res.json({
            errorList: errorList,
            resValue: resValue
          })
        }
      }
    }
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
