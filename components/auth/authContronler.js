const authService = require('../../services/authService')
const passport = require('passport')
const express = require('express')
const router = express.Router()


// Require access_token(google token) in request body
router.post(
  '/google-token',
  passport.authenticate('google-token', { 
    session: false,
    scope: ['profile', 'email'],
  }), authService.signToken
)

// route to check token with postman.
// using middleware to check for authorization header
router.get('/myverify', authService.checkToken, (req, res) => {
  resBody = {
    authData: req.authData,
    author: 'MinZox',
  }
  res.json(resBody)
})

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
