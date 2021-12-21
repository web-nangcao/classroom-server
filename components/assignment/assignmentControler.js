const express = require('express')

const router = express.Router()

const authService = require('../../services/authService')
const ClassRoom = require('../classroom/ClassRoom')
const Assignment = require('./Assignment')
const mongoose = require('mongoose')

// POST get assignment detail
router.post('/get-detail', authService.checkToken, async (req, res, next) => {
  const { assignmentId } = req.body
  const errorList = []
  let resValue = null
  try {
    const assignment = await Assignment.findOne({ _id: assignmentId })
    if (!assignment) {
      errorList.push('Assignment ID khong ton tai')
    } else {
      if (!authService.isBelongToClass(req.authData.email, assignment.classroomId)) {
        errorList.push('Học sinh/giáo viên không có quyền xem assignment này')
      } else {
        resValue = assignment
      }
    }
    await res.json({
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
    await res.json({
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
      errorList.push(new Error('ClassroomID khong ton tai'))
    } else {
      if (!authService.isAdminOrTeacher(classroomId, req.authData.userEmail)) {
        errorList.push(new Error('Ban khong co quyen cap nhat assignment'))
      } else {
        await Assignment.deleteMany({classroomId: classroomId})
        classroom.assignments = []
        // Insert new assignment
        for (let i = 0; i < assignments.length; i++) {
          const new_assignment = await new Assignment({
            name: assignments[i].name,
            point: assignments[i].point,
            email: req.authData.userEmail,
            classroomId: classroomId,
          }).save()
          classroom.assignments.push(new_assignment._id)
        }
        resValue = await classroom.save()
      }
      console.log('Chỉnh sửa assignments thành công')
      await res.json({
        resValue: resValue,
        errorList: errorList,
      })
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
