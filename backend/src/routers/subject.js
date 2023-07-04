const subjectController = require('../controllers/subject')
const express = require('express')
const multerUpload = require('../middleware/upload')

const router = express.Router();

//get a subject info
router.get('/:id', subjectController.getSubject)

//create a subject
router.post('/', subjectController.createSubject)

//update a subject
router.put('/:id', subjectController.updateSubject)

//delete a subject
router.delete('/:id', subjectController.deleteSubject)

//get subjects list by query
router.get('/', subjectController.getSubjectsByQuery)

//create multiple subject using file
router.post('/multiple', multerUpload.single('file'), subjectController.bulkCreateSubjects)

module.exports = router;