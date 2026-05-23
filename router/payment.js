const Router = require('express').Router();
const {create_payment,verify_payment} = require('../controllers/payment');
const {authmiddleware} = require('../middleware/authmiddleware');

Router.post('/create-intent', authmiddleware, create_payment);
Router.post('/confirm', authmiddleware, verify_payment);

module.exports = Router;