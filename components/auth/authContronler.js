const authService = require('../../services/authService')
const passport = require('passport')
const express = require('express')
const router = express.Router()
const User = require('../user/User')
const brcypt = require('bcrypt')
const SystemAdmin = require('../system-admin/SystemAdmin')

// Require access_token(google token) in request body
router.post(
  '/google-token',
  passport.authenticate('google-token', {
    session: false,
    scope: ['profile', 'email'],
  }),
  authService.signToken
)

// Local login
router.post(
  '/local-login',
  async (req, res, next) => {
    const { email, password } = req.body
    try {
      const user = await User.findOne({ email: email })
      if (!user) {
        res.json('Email khong ton tai')
      } else {
        const isMatch = brcypt.compareSync(password, user.password)
        if (!isMatch) {
          res.json('Mat khau khong dung')
        } else {
          if (!user.isActive) {
            res.json('Tai khoan chua duoc kich hoat')
          } else {
            if (user.isLock) {
              res.json('Tai khoan nay da bi khoa')
            } else {
              req.user = user
              next()
            }
          }
        }
      }
    } catch (error) {
      console.log('error as local-login', err, email)
      res.json(error)
    }
  },
  authService.signToken
)

// System admin login
router.post(
  '/system-admin-login',
  async (req, res, next) => {
    const { email, password } = req.body
    try {
      const system_admin = await SystemAdmin.findOne({ email: email })
      if (!system_admin) {
        res.json('Email khong ton tai')
      } else {
        const isMatch = brcypt.compareSync(password, system_admin.password)
        if (!isMatch) {
          res.json('Mat khau khong dung')
        } else {
          if (!system_admin.isActive) {
            res.json('Tai khoan chua duoc kich hoat')
          } else {
            req.user = system_admin
            next()
          }
        }
      }
    } catch (error) {
      console.log('error as local-login', err, email)
      res.json(error)
    }
  },
  authService.signToken
)

// logout
router.get('/logout', authService.checkToken, (req, res) => {
  req.logout()
  if (process.env.FONTEND_LOGIN) {
    res.redirect(process.env.FONTEND_LOGIN)
  } else {
    res.send('Fontend_login_page')
  }
})

module.exports = router
