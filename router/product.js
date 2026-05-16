const Router = require('express').Router();
const {products , product,create_product}  = require('../controllers/product');
const {adminmiddleware} = require('../middleware/authmiddleware');

Router.get('/', products);
Router.get('/:id', product);
Router.post('/createProduct', adminmiddleware, create_product);

module.exports = Router;
