const expressAsyncHandler = require('express-async-handler');
const Payout = require('../models/payout');
const crypto = require('crypto');
const fetch = globalThis.fetch || require('node-fetch').default || require('node-fetch');

const CASHFREE_PAYOUT_BASE_URL =
    process.env.CASHFREE_PAYOUT_ENV === 'production'
        ? 'https://api.cashfree.com/payout'
        : 'https://sandbox.cashfree.com/payout';

const payoutHeaders = () => ({
    'x-client-id': process.env.CASHFREE_PAYOUT_CLIENT_ID || process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_PAYOUT_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY,
    'x-api-version': '2024-01-01',
    'Content-Type': 'application/json'
});

// 1. Add Beneficiary to Cashfree Payout
const add_beneficiary = expressAsyncHandler(async (req, res) => {
    try {
        const {
            beneficiary_id,
            beneficiary_name,
            email,
            phone,
            payment_method, // 'bank' or 'upi'
            bank_account_number,
            bank_ifsc,
            vpa
        } = req.body;

        // AUTH & ADMIN CHECK (Only admin should add beneficiaries or trigger payouts)
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        // VALIDATION
        if (!beneficiary_id || !beneficiary_name) {
            return res.status(400).json({ message: 'Beneficiary ID and Name are required' });
        }

        const instrumentDetails = {};
        if (payment_method === 'bank') {
            if (!bank_account_number || !bank_ifsc) {
                return res.status(400).json({ message: 'Bank account number and IFSC are required for bank transfer' });
            }
            instrumentDetails.bank_account_number = bank_account_number;
            instrumentDetails.bank_ifsc = bank_ifsc;
        } else if (payment_method === 'upi') {
            if (!vpa) {
                return res.status(400).json({ message: 'UPI ID (VPA) is required for UPI transfer' });
            }
            instrumentDetails.vpa = vpa;
        } else {
            return res.status(400).json({ message: 'Invalid payment method. Use bank or upi' });
        }

        const payload = {
            beneficiary_id,
            beneficiary_name,
            beneficiary_instrument_details: instrumentDetails,
            beneficiary_contact_details: {
                beneficiary_email: email || 'admin@harshithaenterprises.com',
                beneficiary_phone: phone || '9999999999'
            }
        };

        // Call Cashfree V2 API
        const response = await fetch(`${CASHFREE_PAYOUT_BASE_URL}/v2/beneficiary`, {
            method: 'POST',
            headers: payoutHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                message: 'Failed to create beneficiary in Cashfree',
                error: data
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Beneficiary registered successfully',
            data
        });

    } catch (error) {
        console.error('Add Beneficiary Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to register beneficiary'
        });
    }
});

// 2. Initiate Transfer / Payout
const create_payout = expressAsyncHandler(async (req, res) => {
    try {
        const { beneficiary_id, amount, transfer_mode, remarks } = req.body;

        // AUTH & ADMIN CHECK
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        // VALIDATION
        if (!beneficiary_id) {
            return res.status(400).json({ message: 'Beneficiary ID is required' });
        }
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Valid payout amount is required' });
        }

        // Generate unique transfer_id
        const transfer_id = `tr_${crypto.randomBytes(8).toString('hex')}`;

        const payload = {
            transfer_id,
            transfer_amount: Number(amount),
            transfer_currency: 'INR',
            transfer_mode: transfer_mode || 'banktransfer',
            beneficiary_details: {
                beneficiary_id
            },
            transfer_remarks: remarks || 'Merchant payout'
        };

        // Call Cashfree V2 Payout API
        const response = await fetch(`${CASHFREE_PAYOUT_BASE_URL}/v2/transfers`, {
            method: 'POST',
            headers: payoutHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                message: 'Failed to initiate transfer in Cashfree',
                error: data
            });
        }

        // Save Payout record to MongoDB
        const newPayout = await Payout.create({
            transfer_id,
            beneficiary_id,
            amount: Number(amount),
            transfer_mode: transfer_mode || 'banktransfer',
            status: data.status || 'PENDING',
            remarks: remarks || 'Merchant payout'
        });

        return res.status(200).json({
            success: true,
            message: 'Payout initiated successfully',
            payout: newPayout,
            cashfree_response: data
        });

    } catch (error) {
        console.error('Create Payout Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to initiate payout'
        });
    }
});

// 3. Verify / Get Payout Status
const verify_payout = expressAsyncHandler(async (req, res) => {
    try {
        const { transfer_id } = req.params;

        // AUTH & ADMIN CHECK
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        // Fetch local record first
        const payoutRecord = await Payout.findOne({ transfer_id });
        if (!payoutRecord) {
            return res.status(404).json({ message: 'Payout record not found in system database' });
        }

        // Call Cashfree V2 Payout status API
        const response = await fetch(`${CASHFREE_PAYOUT_BASE_URL}/v2/transfers/${transfer_id}`, {
            method: 'GET',
            headers: payoutHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                message: 'Failed to fetch payout status from Cashfree',
                error: data
            });
        }

        // Update status in MongoDB
        if (data.status) {
            payoutRecord.status = data.status;
            if (data.utr) {
                payoutRecord.utr = data.utr;
            }
            if (data.failure_reason) {
                payoutRecord.failure_reason = data.failure_reason;
            }
            await payoutRecord.save();
        }

        return res.status(200).json({
            success: true,
            payout: payoutRecord,
            cashfree_response: data
        });

    } catch (error) {
        console.error('Verify Payout Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify payout status'
        });
    }
});

// 4. List local payouts
const list_payouts = expressAsyncHandler(async (req, res) => {
    try {
        // AUTH & ADMIN CHECK
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        const payouts = await Payout.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, payouts });

    } catch (error) {
        console.error('List Payouts Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve payouts list'
        });
    }
});

module.exports = {
    add_beneficiary,
    create_payout,
    verify_payout,
    list_payouts
};
