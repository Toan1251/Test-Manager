const express = require('express');
const multerUpload = require('../middleware/upload')
const testClassController = require('../controllers/testclass')

const router = express.Router();

//create a new test class
router.post('/', testClassController.createTestClass)

//get a test class
router.get('/:id', testClassController.getTestClass)

//update a test class
router.put('/:id', testClassController.updateTestClass)

//deleta a test class
router.delete('/:id', testClassController.deleteTestClass)

//find test class
router.get('/', testClassController.findTestClass)

//add students into testclass
router.post('/add/students/:id', testClassController.addStudentToTestClass)

//add Lectures tobe proctor
router.post('/add/lectures/:id', testClassController.addProctorToTestClass)

//auto create test class from studyclass
router.post('/studyclass/:id', testClassController.autoCreateTestClass)

//create multiple empty test class by file
router.post('/multiple', multerUpload.single('file'), testClassController.bulkCreateTestClass)

//Add students into test class by file
router.post('/add/students/multiple/:id', multerUpload.single('file'), testClassController.addStudentToTestClassByFile)

//Import file to create multiple test class with student
router.post('/add/all', multerUpload.single('file'))

module.exports = router