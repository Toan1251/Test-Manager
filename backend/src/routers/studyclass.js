const express = require('express')
const multerUpload = require('../middleware/upload')
const studyClassController = require('../controllers/studyclass')

const router = express.Router();

//Create new Study Class (must have subject and lecture, lecture can be find by email, subject can be find by code)
router.post('/', studyClassController.createStudyClass)

//Get a Study Class with Lecture, Subject, and Students List (using uuid or code)
router.get('/:id', studyClassController.getStudyClass)

//Update a Study Class
router.put('/:id', studyClassController.updateStudyClass)

//Delete a Study Class
router.delete('/:id', studyClassController.deleteStudyClass)

//Find Study Classes by Query
router.get('/', studyClassController.findStudyClasses)

//Add a list of Student into a Study Class, (Student can use Email or Mssv)
router.post('/add/:id', studyClassController.addStudentToStudyClass)

//Create multiple studyClass by file
router.post('/multiple', multerUpload.single('file'), studyClassController.bulkCreateStudyClass)

//Import a list of students by file into a Study Class
router.post('/multiple/:id', multerUpload.single('file'), studyClassController.addStudentToStudyClassByFile)



module.exports = router;