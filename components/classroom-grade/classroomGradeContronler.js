const express = require('express')
const router = express.Router()
const csv_writer = require('csv-writer')
const csv_parser = require('csv-parser')
const fs = require('fs')
const authService = require('../../services/authService')
const ClassRoom = require('../classroom/ClassRoom')
const Assginment = require('../assignment/Assignment')
const ClassroomGrade = require('./ClassroomGrade')
const GradeWriteType = require('./GradeWriteType')
const formidable = require('formidable')
const Assignment = require('../assignment/Assignment')
const User = require('../user/User')
const UserType = require('../user/UserType')

async function updateOrCreateClassroomGrade(classroomId) {
  return new Promise(async (resolve, reject) => {
    try {
      const classroom = await ClassRoom.findOne({ _id: classroomId }).populate('assignments')
      const assignments = []
      classroom.assignments.forEach((assignment) => {
        assignments.push({ assignmentId: assignment._id, is_finallized: false })
      })
      const classroom_grade = await ClassroomGrade.findOne({classroomId: classroomId})
      if (!classroom_grade) {
        const new_classroom_grade = await new ClassroomGrade({
          classroomId: classroomId,
          assignments: assignments,
        }).save()
        const tmp = await ClassroomGrade.findOne({_id: new_classroom_grade._id}).populate('assignments.assignmentId')
        resolve(tmp)
      } else {
        classroom_grade.assignments = assignments
        await classroom_grade.save()
        const tmp = await ClassroomGrade.findOne({_id: classroom_grade._id}).populate('assignments.assignmentId')
        resolve(tmp)
      }
    } catch (error) {
      reject(error)
    }
  })
}

async function save_file(new_file_name, file, classroomId) {
  return new Promise(async (resolve, reject) => {
    try {
      const list_files = fs.readdirSync('public/classroom-grade')
      if (list_files.indexOf(classroomId) == -1) {
        fs.mkdirSync(`public/classroom-grade/${classroomId}`)
      }
      const data = fs.readFileSync(file.filepath)
      const path = `public/classroom-grade/${classroomId}/${new_file_name}.csv`
      fs.writeFileSync(path, data)
      fs.unlinkSync(file.filepath)
      resolve(path)
    } catch (error) {
      reject(error)
    }
  })
}

async function export_grade_csv(type, classroomId, assignmentName) {
  return new Promise(async (resolve, reject) => {
    try {
      url = null
      listDir = fs.readdirSync(`public/classroom-grade/`)
      if (listDir.indexOf(classroomId) == -1) {
        fs.mkdirSync(`public/classroom-grade/${classroomId}`)
      }
      switch (type) {
        case GradeWriteType.DOWNLOAD_STUDENT_LIST_TEMPLATE: {
          header = [
            {
              id: 'code',
              title: 'Mssv',
            },
            {
              id: 'name',
              title: 'Họ và tên',
            },
          ]
          path = `public/classroom-grade/${classroomId}/student_list_template.csv`
          csv_writer_config = {
            path: path,
            header: header,
            encoding: 'utf8',
          }
          data = []
          grade_csv_writer = csv_writer.createObjectCsvWriter(csv_writer_config)
          grade_csv_writer.writeRecords(data)
          url = `${process.env.HOSTNAME}/classroom-grade/${classroomId}/student_list_template.csv`
          break
        }
        case GradeWriteType.DOWNLOAD_STUDENT_GRADE_BOARD: {
          const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
          header = [
            {
              id: 'code',
              title: 'Mssv',
            },
            {
              id: 'name',
              title: 'Họ và tên',
            },
          ]
          classroom_grade.assignments.forEach((assignment) => {
            header.push({
              id: assignment.assignmentId.name,
              title: assignment.assignmentId.name,
            })
          })
          path = `public/classroom-grade/${classroomId}/student_grade_board.csv`
          csv_writer_config = {
            path: path,
            header: header,
            encoding: 'utf8',
          }
          data = classroom_grade.grades
          grade_csv_writer = csv_writer.createObjectCsvWriter(csv_writer_config)
          grade_csv_writer.writeRecords(data)
          url = `${process.env.HOSTNAME}/classroom-grade/${classroomId}/student_grade_board.csv`
          break
        }
        case GradeWriteType.DOWNLOAD_STUDENT_SPEC_GRADE: {
          const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
          header = [
            {
              id: 'code',
              title: 'Mssv',
            },
            {
              id: 'name',
              title: 'Họ và tên',
            },
            {
              id: assignmentName,
              title: assignmentName,
            },
          ]
          path = `public/classroom-grade/${classroomId}/student_spec_grade.csv`
          csv_writer_config = {
            path: path,
            header: header,
            encoding: 'utf8',
          }
          data = classroom_grade.grades
          grade_csv_writer = csv_writer.createObjectCsvWriter(csv_writer_config)
          grade_csv_writer.writeRecords(data)
          url = `${process.env.HOSTNAME}/classroom-grade/${classroomId}/student_spec_grade.csv`
          break
        }
      }
      resolve(url)
    } catch (error) {
      reject(error)
    }
  })
}

async function getStudentCodeByEmail(classroomId, email) {
  return new Promise(async(resolve, reject)=>{
    const classroom = await ClassRoom.findOne({_id: classroomId})
    if (!classroom) {
      reject(new Error('Lop hoc khong ton tai'))
    } else {
      const user = await User.findOne({email: email})
      if (user.classrooms.indexOf(classroomId) == -1) {
        reject(new Error('Hoc sinh chua tham gia lop hoc nay'))
      } else {
        classroom.members.forEach(member => {
          if (member.email == email) {
            resolve(member.code)
          }
        });
        reject(null)
      }
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
      reject(error)
    }
  })
}

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

// Download student_list_template
router.get(
  '/download-student-list-template/:classroomId',
  authService.checkToken,
  async (req, res) => {
    const { classroomId } = req.params
    const errorList = []
    let resValue = null
    try {
      const classroom = await ClassRoom.findOne({ _id: classroomId })
      if (!classroom) {
        errorList.push('ClassroomId khong ton tai')
      } else {
        const url = await export_grade_csv(
          GradeWriteType.DOWNLOAD_STUDENT_LIST_TEMPLATE,
          classroomId,
          null
        )
        resValue = {
          url: url,
        }
        res.json({
          resValue: resValue,
          errorList: errorList,
        })
      }
    } catch (error) {
      console.log('Download-student-list-template error: ', error)
      errorList.push(error)
      res.json({
        errorList: errorList,
        resValue: resValue,
      })
    }
  }
)

// Upload student list
router.post('/upload-student-list/:classroomId', authService.checkToken, async (req, res) => {
  const { classroomId } = req.params
  let resValue = null
  const errorList = []
  try {
    const classroom = await ClassRoom.findOne({ _id: classroomId })
    if (!classroom) {
      errorList.push(new Erorr('Lop hoc khong ton tai'))
      res.json({errorList: errorList})
    } else {
      const form_data = new formidable.IncomingForm()
      form_data.parse(req, async (err, fields, files) => {
        if (err) {
          console.log('Error as upload-student-list', err)
          errorList.push(err)
          res.json({
            resValue: resValue,
            errorList: errorList,
          })
        } else {
          const new_file_name = 'student_list'
          const path = await save_file(new_file_name, files.file, classroomId)

          data = []
          fs.createReadStream(path)
            .pipe(csv_parser({ delimeter: ',' }))
            .on('data', async (row) => {
              data.push(row)
            })
            .on('end', async () => {
              const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
              const grades = []
              const studentCodes = []
              data.forEach((row) => {
                const grade = {}
                grade['code'] = row['Mssv']
                grade['name'] = row['Họ và tên']
                classroom_grade.assignments.forEach((assignment) => {
                  grade[`${assignment.assignmentId.name}`] = 0
                })
                grades.push(grade)
                studentCodes.push(row['Mssv'])
              })
              classroom_grade.grades = grades
              classroom_grade.studentCodes = studentCodes
              await classroom_grade.save()

              resValue = classroom_grade
              console.log('upload student-list')
              res.json({
                resValue: resValue,
                errorList: errorList,
              })
            })
        }
      })
    }
  } catch (error) {
    console.log('error as upload-student-list', error)
    errorList.push(error)
    res.json({
      resValue: resValue,
      errorList: errorList,
    })
  }
})

// Download student grade-board-template
router.get(
  '/download-student-grade-board/:classroomId',
  authService.checkToken,
  async (req, res) => {
    const { classroomId } = req.params
    const errorList = []
    let resValue = null
    try {
      const classroom = await ClassRoom.findOne({ _id: classroomId })
      if (!classroom) {
        errorList.push('ClassroomId khong ton tai')
        res.json({
          resValue: resValue,
          errorList: errorList,
        })
      } else {
        const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
        if (!classroom_grade) {
          classroom_grade = await updateOrCreateClassroomGrade(classroomId)
        }
        const url = await export_grade_csv(
          GradeWriteType.DOWNLOAD_STUDENT_GRADE_BOARD,
          classroomId,
          null
        )
        resValue = {
          url: url,
        }
        res.json({
          resValue: resValue,
          errorList: errorList,
        })
      }
    } catch (error) {
      console.log('Download-student-grade-board error: ', error)
      errorList.push(error)
      res.json({
        errorList: errorList,
        resValue: resValue,
      })
    }
  }
)

// Upload student-grade-board
router.post(
  '/upload-student-grade-board/:classroomId',
  authService.checkToken,
  async (req, res) => {
    const { classroomId } = req.params
    let resValue = null
    const errorList = []
    try {
      const classroom = await ClassRoom.findOne({ _id: classroomId })
      if (!classroom) {
        errorList.push(new Erorr('Lop hoc khong ton tai'))
        res.json('Classroom khong ton tai')
      } else {
        const form_data = new formidable.IncomingForm()
        form_data.parse(req, async (err, fields, files) => {
          if (err) {
            console.log('Error as upload-student-grade-board', err)
            errorList.push(err)
            res.json({
              resValue: resValue,
              errorList: errorList,
            })
          } else {
            const new_file_name = 'student_grade_board'
            const path = await save_file(new_file_name, files.file, classroomId)

            data = []
            fs.createReadStream(path)
              .pipe(csv_parser({ delimeter: ',' }))
              .on('data', async (row) => {
                data.push(row)
              })
              .on('end', async () => {
                const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
                const grades = []
                const studentCodes = []
                data.forEach((row) => {
                  const grade = {}
                  grade['code'] = row['Mssv']
                  grade['name'] = row['Họ và tên']
                  classroom_grade.assignments.forEach((assignment) => {
                    grade[`${assignment.assignmentId.name}`] = row[`${assignment.assignmentId.name}`]
                  })
                  grades.push(grade)
                  studentCodes.push(row['Mssv'])
                })
                classroom_grade.grades = grades
                await classroom_grade.save()

                resValue = classroom_grade
                console.log('upload student-grade-board')
                res.json({
                  resValue: resValue,
                  errorList: errorList,
                })
              })
          }
        })
      }
    } catch (error) {
      console.log('error as upload-student-grade-board', error)
      errorList.push(error)
      res.json({
        resValue: resValue,
        errorList: errorList,
      })
    }
  }
)

// Download student-spec-grade
router.get(
  '/download-student-spec-grade/:classroomId/:assignmentId',
  authService.checkToken,
  async (req, res) => {
    const { classroomId, assignmentId } = req.params
    const errorList = []
    let resValue = null
    try {
      const classroom = await ClassRoom.findOne({ _id: classroomId })
      if (!classroom) {
        errorList.push('ClassroomId khong ton tai')
        res.json({ errorList: errorList })
      } else {
        const index = classroom.assignments.indexOf(assignmentId)
        const assignment = await Assginment.findOne({ _id: assignmentId })
        if (index == -1) {
          errorList.push(`AssignmentId: ${assignmentId} khong thuoc ${classroomId}`)
          res.json({ errorList: errorList })
        } else if (!assignment) {
          res.json('AssignmentId khong ton tai')
        } else {
          const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
          if (!classroom_grade) {
            classroom_grade = await updateOrCreateClassroomGrade(classroomId)
          }
          const url = await export_grade_csv(
            GradeWriteType.DOWNLOAD_STUDENT_SPEC_GRADE,
            classroomId,
            assignment.name
          )
          resValue = {
            url: url,
          }
          res.json({
            resValue: resValue,
            errorList: errorList,
          })
        }
      }
    } catch (error) {
      console.log('Download-student-spec-grade error: ', error)
      errorList.push(error)
      res.json({
        errorList: errorList,
        resValue: resValue,
      })
    }
  }
)

// Upload student-spec-grade
router.post(
  '/upload-student-spec-grade/:classroomId/:assignmentId',
  authService.checkToken,
  async (req, res) => {
    const { classroomId, assignmentId } = req.params
    let resValue = null
    const errorList = []
    try {
      const classroom = await ClassRoom.findOne({ _id: classroomId })
      const assignment = await Assignment.findOne({_id: assignmentId})
      if (!classroom) {
        errorList.push(new Erorr('Lop hoc khong ton tai'))
        res.json({errorList: errorList})
      } else if (!assignment) {
        res.json('Assignment khong ton tai')
      } else {
        const form_data = new formidable.IncomingForm()
        form_data.parse(req, async (err, fields, files) => {
          if (err) {
            console.log('Error as upload-student-spec-grade', err)
            errorList.push(err)
            res.json({
              resValue: resValue,
              errorList: errorList,
            })
          } else {
            const new_file_name = 'student_spec_grade'
            const path = await save_file(new_file_name, files.file, classroomId)

            data = []
            fs.createReadStream(path)
              .pipe(csv_parser({ delimeter: ',' }))
              .on('data', async (row) => {
                data.push(row)
              })
              .on('end', async () => {
                const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
                if (!classroom_grade) {
                  res.json('Classroom_grade khong ton tai')
                } else {
                  const spec_grades = {}
                  data.forEach((row) => {
                    const grade = {}
                    grade['code'] = row['Mssv']
                    grade['name'] = row['Họ và tên']
                    grade[`${assignment.name}`] = row[`${assignment.name}`]
                    spec_grades[`${grade['code']}`] = grade
                  })
                  const grades = []
                  classroom_grade.grades.forEach(grade =>{
                    const code = grade['code']
                    grade[`${assignment.name}`] = spec_grades[code][`${assignment.name}`]
                    grades.push(grade)
                  })
                  classroom_grade.grades = grades
                  await classroom_grade.save()
  
                  resValue = classroom_grade
                  console.log('upload student-spec-grade')
                  res.json({
                    resValue: resValue,
                    errorList: errorList,
                  })
                }
              })
          }
        })
      }
    } catch (error) {
      console.log('error as upload-student-spec-grade', error)
      errorList.push(error)
      res.json({
        resValue: resValue,
        errorList: errorList,
      })
    }
  }
)

// Get classroom_grade_detail
router.get('/classroom-grade-detail/:classroomId', authService.checkToken, async(req, res)=>{
  const {classroomId} = req.params
  const classroom = await ClassRoom.findOne({_id: classroomId})
  if (!classroom) {
    res.json('ClassroomId khong ton tai')
  } else {
    const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
    if (!classroom_grade) {
      res.json('Classroom_grade khong ton tai')
    } else {
      const resValue = classroom_grade
      res.json({resValue: resValue})
    }
  }
})

// Student view grades
router.post('/student-view-grades', authService.checkToken, async(req, res, next)=>{
  const {classroomId} = req.body
  try {
    const classroom = await ClassRoom.findOne({_id: classroomId})
    if (!await isBelongToClass(req.authData.userEmail, classroomId)) {
      res.json('Ban khong thuoc lop nay')
    } else {
      const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
      if (!classroom_grade) {
        res.json('Chua co diem')
      } else {
        const code = await getStudentCodeByEmail(classroomId, req.authData.userEmail)
        if (code == null) {
          res.json('Chua mapping mssv')
        } else {
          console.log('code: ', code)
          // console.log('classroom_grade: ', classroom_grade)

          let flag = false 
          const resValue = {}
          for(let i = 0; i < classroom_grade.grades.length; i++) {
            if (classroom_grade.grades[i].code == code) {
              resValue['grade'] = classroom_grade.grades[i]
              resValue['user'] = await User.findOne({email: req.authData.userEmail})
              flag = true
              break;
            }
          }
          if (flag) {
            res.json(resValue)
          } else {
            res.json('Khong tim thay diem')
          }
        }
      }
    } 
  } catch (error) {
    console.log('error as student-view-grades', err)
    res.json(error)
  }
})

// Student view spec grade
router.post('/student-view-spec-grade', authService.checkToken, async(req, res)=>{
  const {classroomId, assignmentId} = req.body
  try {
    const classroom = await ClassRoom.findOne({_id: classroomId})
    if (!classroom) {
      res.json('Classroom khong ton tai')
    } else if (classroom.assignments.indexOf(assignmentId) == -1) {
      res.json('Assignment khong thuoc lop hoc')
    } else {
      const assignment = await Assignment.findOne({_id: assignmentId}) 
      if (!assignment) {
        res.json('assignment khong ton tai')
      } else {
        const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
        let flag = false
        classroom_grade.assignments.forEach(element => {
          if (element.assignmentId._id == assignmentId && element.is_finallized == false) {
            flag = true
          }
        });
        if (flag == true) {
          res.json('Diem nay chua finalized')
        } else {
          const code = await getStudentCodeByEmail(classroomId, email)
          if (code == null) {
            res.json('Hoc sinh chua mapping mssv')
          } else {
            let point = null
            classroom_grade.grades.forEach(grade =>{
              if (grade.code == code) {
                point = grade[`${assignment.name}`]
              }
            })
            res.json({
              assignment: assignment,
              point: point
            })
          }
        }
      }
    }
  } catch (error) {
    console.log('error as student-view-grade: ', error)
    res.json(error)
  }
})

// Teacher mark assignment as finalized
router.post('/mark-assignment-finallized', authService.checkToken, async(req, res)=>{
  const {classroomId, assignmentId, is_finallized} = req.body
  try {
    const classroom = await ClassRoom.findOne({_id: classroomId})
    if (!classroomId) {
      res.json('Classroom khong ton tai')
    } else {
      const assignment = await Assignment.findOne({_id: assignmentId})
      if (!assignment) {
        res.json('Assignment khong ton tai')
      } else {
        if(classroom.assignments.indexOf(assignmentId) == -1) {
          res.json('Assignment khong thuoc classroom')
        } else {
          if (!await isAdminOrTeacher(classroomId, req.authData.userEmail)) {
            res.json('Ban khong co quyen thuc hien function nay')
          } else {
            const classroom_grade = await updateOrCreateClassroomGrade(classroomId)
            const assignments = classroom_grade.assignments
            assignments.forEach(assignment=>{
              if(assignment.assignmentId._id == assignmentId) {
                assignment.is_finallized = is_finallized
              }
            })
            classroom_grade.assignments = assignments
            await classroom_grade.save()
            res.json(classroom_grade)
          }
        }
      }
    }
  } catch (error) {
    console.log('error as mark-assignment-finallized', error)
    res.json(error)
  }
})



module.exports = router
