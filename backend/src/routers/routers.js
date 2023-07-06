const express = require('express');

const router = express.Router();
router.use('/auth', require('./auth'));
router.use('/user', require('./user'));
router.use('/subject', require('./subject'));
router.use('/testroom', require('./testroom'))
router.use('/studyclass', require('./studyclass'))
router.use('/testclass', require('./testclass'))

module.exports = router;