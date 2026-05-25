const Router = require('express').Router();
const {
    add_beneficiary,
    create_payout,
    verify_payout,
    list_payouts
} = require('../controllers/payout');
const { authmiddleware } = require('../middleware/authmiddleware');

Router.post('/beneficiary', authmiddleware, add_beneficiary);
Router.post('/transfer', authmiddleware, create_payout);
Router.get('/transfer/:transfer_id', authmiddleware, verify_payout);
Router.get('/list', authmiddleware, list_payouts);

module.exports = Router;
