const express = require('express');
const userController = require('../controllers/user')
const router = express.Router();

//get a user profile
router.get('/:id', userController.getUser)

router.get('/student/:id', userController.getStudent)

module.exports = router