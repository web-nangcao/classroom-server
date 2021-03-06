const express = require('express')
const router = express.Router()
const User = require('./User')
const authService = require('../../services/authService')
const bcrypt = require('bcrypt')
const mailService = require('../../services/mailService')
const ClassRoom = require('../classroom/ClassRoom')

// POST - manage user profile
router.post('/account/manage-profile', authService.checkToken, async (req, res) => {
  const { code, name } = req.body
  const errorList = []
  let resValue = null

  try {
    const user = await User.findOne({ email: req.authData.userEmail })
    if (!user) {
      errorList.push('User không tồn tại')
    } else {
      user.code = code
      user.name = name
      await user.save()
      resValue = {
        user: user,
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

// POST get user profile
router.post('/get-usertype', authService.checkToken, async (req, res)=>{
  const {email, classroomId} = req.body
  try {
    const user = await User.findOne({email: email})
    if (!user) {
      res.json('Email khong ton tai')
    } else {
      const classroom = await ClassRoom.findOne({_id: classroomId})
      if (!classroom) {
        res.json('classroomid khong ton tai')
      } else {
        let userType = null        
        for (let i = 0; i < classroom.members.length; i++) {
          if (classroom.members[i].email == email) {
            userType = classroom.members[i].userType
            break;
          }
        }
        res.json(userType)
      }
    }
  } catch (error) {
    console.log('error as user-detail')
    res.json(error)
  }
})

// Get active gmail
router.get('/local-active-mail/:email', async (req, res) => {
  const { email } = req.params
  try {
    const user = await User.findOne({ email: email })
    if (!user) {
      res.json('Tai khoan khong ton tai')
    } else {
      if (user.isActive) {
        res.json('Tai khoan da duoc kich hoat roi')
      } else {
        user.isActive = true
        await user.save()
        res.json({
          user: user,
        })
      }
    }
  } catch (error) {
    console.log('error as active gmail', error, email)
    res.json(error)
  }
})

// Post register new local_user
router.post('/local-register', async (req, res) => {
  const { email, name, password } = req.body
  try {
    const user = await User.findOne({ email: email })
    if (user) {
      res.json({
        error: 'Tai khoan da ton tai roi',
      })
    } else {
      const salt = bcrypt.genSaltSync(10)
      hash_password = bcrypt.hashSync(password, salt)
      const new_user = await new User({
        email: email,
        password: hash_password,
        name: name,
        isActive: false,
      }).save()
      const activeLink = `${process.env.HOSTNAME}/user/local-active-mail/${email}`
      const message = mailService.activeMail(new_user.email, activeLink)
      res.json({
        resValue: {
          new_user: new_user,
          message: message,
        },
      })
    }
  } catch (error) {
    console.log('error as register new localuser', error)
    res.json(error)
  }
})

// change password
router.post('/renew-password', authService.checkToken, async (req, res) => {
  const { password } = req.body
  try {
    const user = await User.findOne({ email: req.authData.userEmail })
    if (!user) {
      res.json('Tai khoan khong ton tai')
    } else {
      const isMatch = bcrypt.compareSync(password, user.password)
      if (isMatch) {
        res.json('Mat khau moi khong duoc trung voi mat khau cu')
      } else {
        const new_password = bcrypt.hashSync(password, 10)
        user.password = new_password
        await user.save()
        res.json({
          user: user,
          message: 'Thay doi password thanh cong',
        })
      }
    }
  } catch (error) {
    console.log('Error as renew-password', email)
    res.json(error)
  }
})

// Change password-email
router.post('/renew-password-email', async(req, res)=>{
  const {email} = req.body
  try {
    const user = await User.findOne({email: email})
    if (!email) {
      res.json('Email khong ton tai')
    } else{
      const new_password = bcrypt.hashSync('539128', 10)
      user.password = new_password
      await user.save()
      const message = await mailService.renewPassword(email, '539128')
      res.json(message)
    }
  } catch (error) {
    console.log('error as renew-password-email')
    res.json(error)
  }
})

module.exports = router
