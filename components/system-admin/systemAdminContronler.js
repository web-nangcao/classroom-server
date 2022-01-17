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
const Notification = require('../notification/Notification')
const NotificationType = require('../notification/NotificationType')
const SystemAdmin = require('./SystemAdmin')
const bcrypt = require('bcrypt')
const mailService = require('../../services/mailService')

// Mange profile
router.post('/manage-profile', authService.checkToken, async (req, res) => {
  const { name } = req.body
  const errorList = []
  let resValue = null

  try {
    const system_admin = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!system_admin) {
      errorList.push('system_admin không tồn tại')
    } else {
      system_admin.name = name
      await system_admin.save()
      resValue = {
        system_admin: system_admin,
      }
    }
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  } catch (error) {
    console.log('error as manage system-admin profile: ', error)
    errorList.push(error)
    res.json({
      errorList: errorList,
      resValue: resValue,
    })
  }
})

// System admin register
router.post('/register', async (req, res) => {
  const { email, name, password } = req.body
  try {
    const system_admin = await SystemAdmin.findOne({ email: email })
    if (system_admin) {
      res.json({
        error: 'Tai khoan da ton tai roi',
      })
    } else {
      const salt = bcrypt.genSaltSync(10)
      hash_password = bcrypt.hashSync(password, salt)
      const new_system_admin = await new SystemAdmin({
        email: email,
        password: hash_password,
        name: name,
      }).save()

      const activeLink = `${process.env.HOSTNAME}/system-admin/local-active-mail/${email}`
      const message = mailService.activeMail(new_system_admin.email, activeLink)
      res.json({
        resValue: {
          new_system_admin: new_system_admin,
          message: message,
        },
      })
    }
  } catch (error) {
    console.log('error as register new systemadmin', error)
    res.json(error)
  }
})

// System admin active email
router.get('/local-active-mail/:email', async (req, res) => {
  const { email } = req.params
  try {
    const system_admin = await SystemAdmin.findOne({ email: email })
    if (!system_admin) {
      res.json('Tai khoan khong ton tai')
    } else {
      if (system_admin.isActive) {
        res.json('Tai khoan da duoc kich hoat roi')
      } else {
        system_admin.isActive = true
        await system_admin.save()
        res.json({
          system_admin: system_admin,
        })
      }
    }
  } catch (error) {
    console.log('error as active gmail', error, email)
    res.json(error)
  }
})

// Renew password
router.post('/renew-password', authService.checkToken, async (req, res) => {
  const { password } = req.body
  try {
    const system_admin = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!system_admin) {
      res.json('Tai khoan khong ton tai')
    } else {
      const isMatch = bcrypt.compareSync(password, system_admin.password)
      if (isMatch) {
        res.json('Mat khau moi khong duoc trung voi mat khau cu')
      } else {
        const new_password = bcrypt.hashSync(password, 10)
        system_admin.password = new_password
        await system_admin.save()
        res.json({
          system_admin: system_admin,
          message: 'Thay doi password thanh cong',
        })
      }
    }
  } catch (error) {
    console.log('Error as renew-password', email)
    res.json(error)
  }
})

// View admin list
router.get('/view-admin-list', authService.checkToken, async (req, res) => {
  try {
    const system_admin = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!system_admin) {
      res.json('system admin khong ton tai')
    } else {
      const system_admin_list = await SystemAdmin.find({})
      res.json(system_admin_list)
    }
  } catch (error) {
    console.log('Error as view-admin-list', error)
    res.json(error)
  }
})

// View admin detail
router.get('/view-admin-detail/:systemAdminId', authService.checkToken, async (req, res) => {
  const { systemAdminId } = req.params
  try {
    const system_admin = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!system_admin) {
      res.json('system admin khong ton tai')
    } else {
      const tmp = await SystemAdmin.find({ _id: systemAdminId })
      if (!tmp) {
        res.json('Khong tim thay admin')
      } else {
        res.json(tmp)
      }
    }
  } catch (error) {
    console.log('Error as view-admin-detail', error)
    res.json(error)
  }
})

// Create admin account
router.post('/create-admin-account', authService.checkToken, async (req, res) => {
  const { email, password, name } = req.body
  try {
    const system_admin = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!system_admin) {
      res.json('system admin khong ton tai')
    } else {
      const flag = await SystemAdmin.findOne({ email: email })
      if (flag) {
        res.json('Email da ton tai roi')
      } else {
        const salt = bcrypt.genSaltSync(10)
        hash_password = bcrypt.hashSync(password, salt)
        const new_system_admin = await new SystemAdmin({
          email: email,
          password: hash_password,
          name: name,
        }).save()

        const activeLink = `${process.env.HOSTNAME}/system-admin/local-active-mail/${email}`
        const message = mailService.activeMail(new_system_admin.email, activeLink)
        res.json({
          resValue: {
            new_system_admin: new_system_admin,
            message: message,
          },
        })
      }
    }
  } catch (error) {
    console.log('Error as create-admin-account', error)
    res.json(error)
  }
})

// View user list
router.get('/view-user-list', authService.checkToken, async (req, res) => {
  try {
    const flag = await SystemAdmin.find({})
    if (!flag) {
      res.json('system admin khong ton tai')
    } else {
      const user_list = await User.find({}).populate('classrooms')
      res.json(user_list)
    }
  } catch (error) {
    console.log('Error as view-user-list', error)
    res.json(error)
  }
})

// View user detail
router.get('/view-user-detail/:userId', authService.checkToken, async (req, res) => {
  const { userId } = req.params
  try {
    const flag = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!flag) {
      res.json('system admin khong ton tai')
    } else {
      const user = await User.findOne({ _id: userId })
      res.json(user)
    }
  } catch (error) {
    console.log('Error as view-user-detail', error)
    res.json(error)
  }
})

// Lock/unLock user
router.post('/lock-unlock-user', authService.checkToken, async (req, res) => {
  const { userId, isLock } = req.body
  try {
    const flag = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!flag) {
      res.json('system admin khong ton tai')
    } else {
      const user = await User.findOne({ _id: userId })
      if (!user) {
        res.json('user khong ton tai')
      } else {
        user.isLock = isLock
        await user.save()
        res.json(user)
      }
    }
  } catch (error) {
    console.log('Error as lock-unlock-user', error)
    res.json(error)
  }
})

// Mapping user code
router.post('/mapping-user-code', authService.checkToken, async(req, res)=>{
  const{userId, code} = req.body
  try {
    const flag = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!flag) {
      res.json('system admin khong ton tai')
    } else {
      const user = await User.findOne({ _id: userId })
      if (!user) {
        res.json('user khong ton tai')
      } else {
        user.code = code
        await user.save()
        res.json(user)
      }
    }
  } catch (error) {
    console.log('Error as mapping-user-code', error)
    res.json(error)
  }
})

// View classroom list
router.get('/view-classroom-list', authService.checkToken, async (req, res) => {
  try {
    const flag = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!flag) {
      res.json('system admin khong ton tai')
    } else {
      const classrooms = await ClassRoom.find({})
      res.json(classrooms)
    }
  } catch (error) {
    console.log('Error as view-classroom-list', error)
    res.json(error)
  }
})

// View classroom detail
router.get('/view-classroom-detail/:classroomId', authService.checkToken, async (req, res) => {
  const { classroomId } = req.body
  try {
    const flag = await SystemAdmin.findOne({ email: req.authData.userEmail })
    if (!flag) {
      res.json('system admin khong ton tai')
    } else {
      const classroom = await ClassRoom.findOne({ _id: classroomId })
      res.json(classroom)
    }
  } catch (error) {
    console.log('Error as view-classroom-detail', error)
    res.json(error)
  }
})

module.exports = router
