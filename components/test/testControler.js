const User = require('../user/User')
const jwt = require('jsonwebtoken')
const express = require('express')
const Assignment = require('../assignment/Assignment')
const router = express.Router()

// Test-Get access_token
router.post('/test-get-access-token', async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email: email })
  if (!user) {
    res.send('Email khong ton tai')
  } else {
    const payload = {
      userId: user._id,
      userEmail: user.email,
    }
    jwt.sign(payload, process.env.MY_SECRET_KEY, { expiresIn: '300 min' }, (err, token) => {
      if (err) {
        res.sendStatus(500)
      } else {
        console.log(`Verified: ${user.email}`)
        res.json({
          user: user,
          access_token: token,
        })
      }
    })
  }
})

// Remove classroom
router.post('/removeClassroom', async (req, res) => {
  ClassRoom.deleteMany({})
    .then(() => {
      console.log('Classroom remove completed')
      res.send('Classroom remove completed')
    })
    .catch(() => {
      console.log('Something go wrong while deleting classrooms')
      res.send('Something go wrong while deleting classrooms')
    })
})

router.get('/getAllUser', async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

// Remove all user
router.post('/removeUser', async (req, res) => {
  User.deleteMany({})
    .then(() => {
      console.log('User remove completed')
      res.send('User remove completed')
    })
    .catch(() => {
      console.log('Something go wrong while deleting users')
      res.send('Something go wrong while deleting users')
    })
})

// Remove all assignment
router.post('/removeAssignment', async(req, res)=>{
  Assignment.deleteMany({})
    .then(() => {
      console.log('Assignment remove completed')
      res.send('Assignment remove completed')
    })
    .catch(() => {
      console.log('Something go wrong while deleting Assignment')
      res.send('Something go wrong while deleting Assignment')
    })
})



module.exports = router