const mongoose = require('mongoose');

const payment = new mongoose.Schema({
    internal_order_id: {
        type: String,
        required: true,
        unique: true
    },
    order_id: {
        type: String,
        required: true,
        unique: true
    },
    cf_order_id: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    payment_session_id: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['created', 'completed', 'failed'],
        default: 'created'
    },
    used: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

module.exports = mongoose.model('payment', payment);
