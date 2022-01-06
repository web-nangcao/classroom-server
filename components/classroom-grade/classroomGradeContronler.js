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
const e = require('express')

async function createClassroomGrade(classroomId) {
  return new Promise(async (resolve, reject) => {
    try {
      const classroom = await ClassRoom.findOne({ _id: classroomId }).populate('assignments')
      const assignments = []
      classroom.assignments.forEach((assignment) => {
        assignments.push({ name: assignment.name, is_finallized: false })
      })
      await ClassroomGrade.deleteMany({ classroomId: classroomId })
      const classroom_grade = await new ClassroomGrade({
        classroomId: classroomId,
        assignments: assignments,
      }).save()
      resolve(classroom_grade)
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
          const classroom_grade = await ClassroomGrade.findOne({ classroomId: classroomId })
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
              id: assignment.name,
              title: assignment.name,
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
          const classroom_grade = await ClassroomGrade.findOne({ classroomId: classroomId })
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
              const classroom_grade = await createClassroomGrade(classroomId)
              const grades = []
              data.forEach((row) => {
                const grade = {}
                grade['code'] = row['Mssv']
                grade['name'] = row['Họ và tên']
                classroom_grade.assignments.forEach((assignment) => {
                  grade[`${assignment.name}`] = 0
                })
                grades.push(grade)
              })
              classroom_grade.grades = grades
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
        const classroom_grade = await ClassroomGrade.findOne({ classroomId: classroomId })
        if (!classroom_grade) {
          classroom_grade = await createClassroomGrade(classroomId)
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
        res.json(new Error('Classroom khong ton tai'))
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
                const classroom_grade = await createClassroomGrade(classroomId)
                const grades = []
                data.forEach((row) => {
                  const grade = {}
                  grade['code'] = row['Mssv']
                  grade['name'] = row['Họ và tên']
                  classroom_grade.assignments.forEach((assignment) => {
                    grade[`${assignment.name}`] = row[`${assignment.name}`]
                  })
                  grades.push(grade)
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
        const assignment = await Assginment.findOne({ assignemntId: assignmentId })
        if (index == -1) {
          errorList.push(`AssignmentId: ${assignemntId} khong thuoc ${classroomId}`)
          res.json({ errorList: errorList })
        } else if (!assignment) {
          res.json(new Error('AssignmentId khong ton tai'))
        } else {
          const classroom_grade = await ClassroomGrade.findOne({ classroomId: classroomId })
          if (!classroom_grade) {
            classroom_grade = await createClassroomGrade(classroomId)
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
        res.json(new Error('Assignment khong ton tai'))
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
                const classroom_grade = await ClassroomGrade.findOne({classroomId: classroomId})
                if (!classroom_grade) {
                  res.json(new Error('Classroom_grade khong ton tai'))
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
    res.json(new Error('ClassroomId khong ton tai'))
  } else {
    const classroom_grade = await ClassroomGrade.findOne({classroomId: classroomId})
    if (!classroom_grade) {
      res.json(new Error('Classroom_grade khong ton tai'))
    } else {
      const resValue = classroom_grade
      res.json({resValue: resValue})
    }
  }
})

module.exports = router
