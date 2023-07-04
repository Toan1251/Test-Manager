const express = require('express')
const multerUpload = require('../middleware/upload')

const router = express.Router();

//user need have permission >= 1 to using this router service

//Create a testroom
//Get a testroom Info with thier testclass
//Update a testroom
//Delete a testroom
//Get testroom by query

module.exports = router;