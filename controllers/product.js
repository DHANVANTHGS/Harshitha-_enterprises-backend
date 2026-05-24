const product_model = require('../models/product');
const expressasynhandler = require('express-async-handler');

const products = expressasynhandler(async(req,res)=>{
    const category = req.query.category;
    if(!category) {
        const all_products = await product_model.find();
        return res.status(200).json(all_products);
    }
    const category_products = await product_model.findAll({category: category});
    return res.status(200).json(category_products);
});

const product = expressasynhandler(async(req,res)=>{
    const id = req.params.id;
    const check_product = await product_model.findById(id);
    if(!check_product) {
        return res.status(404).json({message: "Product not found"});
    }
    return res.status(200).json(check_product);
});

const create_product = expressasynhandler(async(req,res)=>{
    const {name ,price , stock , category} = req.body;
    console.log(`creating product with name: ${name}, price: ${price}, stock: ${stock}, category: ${category}`);
    const new_product = await product_model.create({
        name: name,
        price: price,
        stock: stock,
        category: category
    });
    console.log(`new product created successfully as ${new_product} by the admin ${req.user.email}`);
    return res.status(201).json(new_product);
});

const update_product = expressasynhandler(async(req,res)=>{
    const id = req.params.id;
    const {name ,price , stock , category} = req.body;
    const check_product = await product_model.findById(id);
    if(!check_product) {
        return res.status(404).json({message: "Product not found"});
    }   
    check_product.name = name || check_product.name;
    check_product.price = price || check_product.price;
    check_product.stock = stock || check_product.stock;
    check_product.category = category || check_product.category;

    const updated_product = await check_product.save();
    return res.status(200).json(updated_product);
});

const delete_product = expressasynhandler(async(req,res)=>{
    const id  = req.params.id;
    const check = await product_model.findById(id);
    if(!check) {
        return res.status(404).json({message: "Product not found"});
    }
    await product_model.findByIdAndDelete(id);
    console.log(`product with id ${id} and data ${check} deleted successfully by the admin ${req.user.email}`);
    return res.status(200).json({message: "Product deleted successfully"});
});

module.exports = {products, product, create_product, update_product, delete_product};
