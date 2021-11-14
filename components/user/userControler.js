const express = require('express')
const router = express.Router()
const User = require('./User')

router.get('/', async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

router.post('/login', async (req, res) => {
  const { gmail, password } = req.body
  const access_key = req.headers.authorization
  const user = await User.find({ gmail: gmail })
  if (user != null) {
    res.json(user)
  }
  res.json('null: ', user)
})

router.post('/register', async (req, res) => {
  const { gmail, password, code, name } = req.body
  const errorList = []
  let resBody = null
  await User.insertMany({
    gmail: gmail,
    password: password,
    code: code,
    name: name,
  })
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
    resBody: resBody
  })
})

router.post('/remove', async(req, res)=>{
  User.remove({}).then(()=>{
    console.log('User remove completed');
    res.send('User remove completed')
  })
})

module.exports = router
