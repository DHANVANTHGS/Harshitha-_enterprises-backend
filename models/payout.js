const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
    transfer_id: {
        type: String,
        required: true,
        unique: true
    },
    beneficiary_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    transfer_mode: {
        type: String,
        enum: ['banktransfer', 'upi', 'imps', 'neft', 'rtgs'],
        default: 'banktransfer'
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'REJECTED'],
        default: 'PENDING'
    },
    utr: {
        type: String
    },
    failure_reason: {
        type: String
    },
    remarks: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
