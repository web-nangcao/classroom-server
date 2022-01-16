const authService = require('../../services/authService')
const passport = require('passport')
const express = require('express')
const router = express.Router()
const User = require('../user/User')
const brcypt = require('bcrypt')

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
router.post('/local-login', async (req, res, next) => {
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
          req.user = user
          next()
        }
      }
    }
  } catch (error) {
    console.log('error as local-login', err, email)
  }
}, authService.signToken)

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
