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
router.post('/set/lectures/:id', testClassController.setProctorToTestClass)

//Add students into test class by file
router.post('/add/students/multiple/:id', multerUpload.single('file'), testClassController.addStudentsToTestClassByFile)

//Import file to create multiple test class with student
router.post('/add/all', multerUpload.single('file'), testClassController.addStudentsToTestClassesByFile)

module.exports = router