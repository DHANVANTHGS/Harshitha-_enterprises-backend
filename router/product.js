const Router = require('express').Router();
const {products , product,create_product,update_product,delete_product}  = require('../controllers/product');
const {adminmiddleware} = require('../middleware/authmiddleware');

Router.get('/', products);
Router.get('/:id', product);
Router.post('/createProduct', adminmiddleware, create_product);
Router.put('/update/:id', adminmiddleware, update_product);
Router.delete('/delete/:id', adminmiddleware, delete_product);

module.exports = Router;
