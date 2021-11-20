const express = require('express')
const router = express.Router()
const ClassRoom = require('./ClassRoom')

router.get('/', async (req, res) => {
  const classrooms = await ClassRoom.find({})
  res.json(classrooms)
})

router.post('/create', async (req, res) => {
  const { className, topic, host } = req.body
  const errorList = []
  let resBody = null

  const newClass = {
    className: className,
    topic: topic,
    host: host,
  }
  await ClassRoom.insertMany(newClass)
    .then((classroom) => {
      console.log('Adding new classroom')
      resBody = classroom
    })
    .catch(() => {
      console.error('Fail while ADDING new classroom')
      errorList.push('Fail while ADDING new classroom')
    })
  await res.json({
    resBody: resBody,
    errorList: errorList,
  })
})

router.post('/remove', async (req, res) => {
  ClassRoom.remove({})
    .then(() => {
      console.log('Classroom remove completed')
      res.send('Classroom remove completed')
    })
    .catch(() => {
      res.send('Something go wrong when delete classrooms')
    })
})

module.exports = router
