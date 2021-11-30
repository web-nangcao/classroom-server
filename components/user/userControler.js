const express = require('express')
const router = express.Router()
const User = require('./User')
const authService = require('../../services/authService')

// POST - manage user profile
// Api endpoint: <Host>/user/account/manage-profile
// Request header: Bearer <access_token>
// Request body = {
//   code: String,
//   name: String
// }
// Response body = {
//   errorList: [],
//   resValue: {
//     user: user
//   }
// }
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
    await res.json({
      errorList: errorList,
      resValue: resValue,
    })
  } catch (error) {
    res.json(error)
  }
})

module.exports = router
