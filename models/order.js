const mongoose = require('mongoose');

const order = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
    total_amount: {
        type: Number,
        required: true
    },
    payment_type: {
        type: String,
        enum: ['online_payment', 'cod'],
        required: true
    }
}, {timestamps: true});

module.exports = mongoose.model('order', order);