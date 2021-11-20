const express = require('express')
const router = express.Router()
const User = require('./User')
const passport = require('passport')
const authService = require('./authService')
// const passportCfg = require('../../config/passport.cfg')(passport)

router.get('/', async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

router.post('/register', async (req, res) => {
  const { email, code, name, googleId } = req.body
  const errorList = []
  let resBody = null
  const newUser = {
    email: email,
    code: code,
    name: name,
    googleId: googleId,
  }
  console.log('user: ', newUser)
  await User.insertMany(newUser)
    .then((user) => {
      console.log('Adding new user')
      resBody = user
    })
    .catch(() => {
      console.error('Fail while ADDING new user')
      errorList.push('Fail while ADDING new user')
    })
  await res.json({
    errorList: errorList,
    resBody: resBody,
  })
})

router.get(
  '/auth/google',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
    accessType: 'offline',
    approvalPrompt: 'force',
  })
)

// callback url upon successful google authentication
router.get(
  '/auth/google/callback/',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    authService.signToken(req, res)
  }
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

router.post('/remove', async (req, res) => {
  User.remove({})
    .then(() => {
      console.log('User remove completed')
      res.send('User remove completed')
    })
    .catch(() => {
      console.log('Something go wrong while deleting users')
      res.send('Something go wrong while deleting users')
    })
})

module.exports = router
