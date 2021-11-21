const express = require('express')
const router = express.Router()
const User = require('./User')
const authService = require('../../services/authService')

router.post('/account/manage-profile', authService.checkToken, async (req, res)=>{
  const {code, name} = req.body
  const errorList = []
  let resValue = null

  const user = await User.findOne({email: req.authData.userEmail})
  if (!user) {
    errorList.push('User không tồn tại')
  }
  else {
    user.code = code
    user.name = name
    await user.save()
    resValue = {
      user: user
    }
  }
  await res.json({
    errorList: errorList,
    resValue: resValue
  })
})

router.get('/getAllUser', async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

router.post('/remove', async (req, res) => {
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


module.exports = router
