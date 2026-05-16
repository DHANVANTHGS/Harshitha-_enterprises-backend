const router = require('express').Router();
const {register, login, me} = require('../controllers/auth');
const {authmiddleware} = require('../middleware/authmiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authmiddleware, me);

module.exports = router;