const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth')
const multerUpload = require('../middleware/upload')

const router = express.Router();

//login
router.post('/login', passport.authenticate('local', { failureRedirect: 'login' }), authController.logIn)
router.get('/login', (req, res) => { res.status(404).send('not found') })

//logout
router.get('/logout', authController.logOut)

//register
router.post('/register', authController.register)

//register multiple by File
router.post('/register/students', multerUpload.single('file'), authController.bulkRegisterStudents)

module.exports = router