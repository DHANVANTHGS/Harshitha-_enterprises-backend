const Router = require('express').Router();
const {authmiddleware} = require('../middleware/authmiddleware');
const {create_order, get_orders,get_order} = require('../controllers/order');

Router.post('/', authmiddleware, create_order);
Router.get('/', authmiddleware, get_orders);
Router.get('/:order_id', authmiddleware, get_order);

module.exports = Router;