const Router = require('express').Router();
const {authmiddleware} = require('../middleware/authmiddleware');
const {cart, patch_item, delete_item, delete_cart, add_item} = require('../controllers/cart');

Router.get('/', authmiddleware, cart);
Router.patch('/items/:product_id', authmiddleware, patch_item);
Router.delete('/items/:product_id', authmiddleware, delete_item);
Router.delete('/', authmiddleware, delete_cart);
Router.post('/add_item/:product_id', authmiddleware, add_item);

module.exports = Router;