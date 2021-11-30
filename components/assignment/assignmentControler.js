const express = require('express')

const router = express.Router()

const authService = require('../../services/authService')
const ClassRoom = require('../classroom/ClassRoom')
const Assignment = require('./Assignment')

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
      resValue = assignment
    }
    await res.json({
      errorList: errorList,
      resValue: resValue,
    })
  } catch (error) {
    res.json(error)
  }
})

// POST add new assignment
router.post('/insert', authService.checkToken, async (req, res, next) => {
  const { classroomId, assignment } = req.body
  const errorList = []
  let resValue = null
  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId })
    if (!classroom) {
      errorList.push('Classroom ID khong ton tai')
    } else {
      const newAssignment = await new Assignment(assignment).save()
      resValue = newAssignment

      classroom.assignments.push(newAssignment)
      await classroom.save()
    }
    await res.json({
      errorList: errorList,
      resValue: resValue,
    })
  } catch (error) {
    res.json(error)
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
    const classroom = await ClassRoom.findOne({ _id: classroomId })
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
    res.json(error)
  }
})

// POST update assignments by classroomId
// Api endpoint: <Host>/assignment/update
// Request header: Bearer <access_token>
// Request body: {
//     classroomId: classroomId
//     assignments: [{
//         assignment: assignment
//     }]
// }
// Response body: {
//     errorList: [],
//     resValue: [{
//         classroom: classroom
//     }]
// }
router.post('/update', authService.checkToken, async (req, res, next) => {
  const { classroomId, assignments } = req.body
  const errorList = []
  let resValue = null
  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId })
    if (!classroom) {
      errorList.push('Classroom khong ton tai')
    } else {
      assignments.forEach(async (assignment) => {
        assignment_flag = await Assignment.findOne({ _id: assignment._id })
        if (!assignment_flag) {
          await new Assignment(assignment).save()
        } else {
          const { name, point, email, classroomId } = assignment
          assignment_flag.name = name
          assignment_flag.point = point
          assignment_flag.email = email
          assignment_flag.classroomId = classroomId
          await assignment_flag.save()
        }
      })
      classroom.assignments = assignments
      await classroom.save()
      resValue = classroom
    }

    await res.json({
      errorList: errorList,
      resValue: resValue,
    })
  } catch (error) {
    res.json(error)
  }
})

module.exports = router
