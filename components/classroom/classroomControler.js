const express = require('express')
const router = express.Router()
const ClassRoom = require('./ClassRoom')

router.get('/', async (req, res) => {
  const classrooms = await ClassRoom.find({})
  res.json(classrooms)
})

router.post('/', async (req, res) => {
  const classroom = req.body
  const errorList = []
  let resBody = null
  await ClassRoom.insertMany([classroom])
    .then((classroom) => {
      console.log('Adding new classroom')
      console.log('classroom: ', classroom)
    })
    .catch(() => {
      console.error('Fail in ADDING new classroom')
      errorList.push('Fail in ADDING new classroom')
    })
})


router.post('/remove', async(req, res)=>{
  ClassRoom.remove({}).then(()=>{
    console.log('Classroom remove completed');
    console.log('Classroom remove completed');
  })
})

module.exports = router
