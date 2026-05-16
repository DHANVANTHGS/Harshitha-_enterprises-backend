const exptessAsyncHandler = require('express-async-handler');
const Order = require('../models/order');
const usermodel = require('../models/user');
const paymentmodel = require('../models/payment');
const user = require('../models/user');


const create_order = exptessAsyncHandler(async(req,res)=>{
    const user_id = req.user.id;
    const {items, total_amount,payment_type} = req.body;
    const check_user = await usermodel.findById(user_id);
    if(!check_user) {
        return res.status(404).json({message: "User not found"});
    }
    if(payment_type === 'online_payment') {
        const {internal_order_id,cf_order_id} = req.body;
        const check_payment = await paymentmodel.findOne({internal_order_id: internal_order_id, cf_order_id: cf_order_id});
        if(!check_payment) {
            return res.status(404).json({message: "Payment record not found"});
        }
        if(check_payment.status !== 'completed') {
            return res.status(400).json({message: "Payment not completed"});
        }
    }
    const new_order = await Order.create({
        user: user_id,
        items: items,
        total_amount: total_amount,
        payment_type: payment_type,
        user: user_id
    });
    check_payment.used = true;
    await check_payment.save();
    check_user.myorders.push(new_order._id);
    await check_user.save();
    return res.status(201).json({message: "Order created successfully", order: new_order});
});

const get_orders = exptessAsyncHandler(async(req,res)=>{
    const user_id = req.user.id;
    const check_user = await usermodel.findById(user_id).populate('myorders');
    if(!check_user) {
        return res.status(404).json({message: "User not found"});
    }
    return res.status(200).json({orders: check_user.myorders});
});

const get_order = exptessAsyncHandler(async(req,res)=>{
    const user_id = req.user.id;
    const order_id = req.params.order_id;
    const check_user = await usermodel.findById(user_id);
    if(!check_user) {
        return res.status(404).json({message: "User not found"});
    }
    const check_order = await Order.findById(order_id);
    if(!check_order) {
        return res.status(404).json({message: "Order not found"});
    }
    return res.status(200).json({order: check_order});
});

module.exports = {create_order, get_orders, get_order};

