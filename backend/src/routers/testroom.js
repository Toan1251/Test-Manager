const express = require('express')
const multerUpload = require('../middleware/upload')
const testRoomController = require('../controllers/testroom')

const router = express.Router();

//user need have permission >= 1 to using this router service

//Create a testroom
router.post('/')

//Get a testroom Info with thier testclass: id will be Id or number of room
router.get('/:id')

//Update a testroom
router.put('/:id')

//Delete a testroom
router.delete('/:id')

//Get testroom by query
router.get('/')

//Create Multiple test room by excel
router.post('/multiple', multerUpload.single('file'))

module.exports = router;