const express = require('express');
const userController = require('../controllers/user')
const router = express.Router();

//get a user profile
router.get('/:id', userController.getUser)

module.exports = router