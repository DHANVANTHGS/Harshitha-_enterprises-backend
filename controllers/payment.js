const expressAsyncHandler = require('express-async-handler');
const payment_model = require('../models/payment');
const crypto = require('crypto');
const fetch = globalThis.fetch || require('node-fetch').default || require('node-fetch');

const CASHFREE_BASE_URL =
    process.env.CASHFREE_ENV === 'production'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';

const cashfreeHeaders = () => ({
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
    'x-api-version': '2023-08-01',
    'Content-Type': 'application/json'
});


const create_payment = expressAsyncHandler(async (req, res) => {

    try {

        const { amount, currency, mobile_no } = req.body;

        // AUTH CHECK
        if (!req.user || !req.user.id) {

            return res.status(401).json({
                message: 'Unauthorized'
            });

        }

        // AMOUNT VALIDATION
        if (!amount || isNaN(amount) || Number(amount) <= 0) {

            return res.status(400).json({
                message: 'Valid amount is required'
            });

        }

        const user_id = req.user.id;

        // SECURE RANDOM IDS
        const order_id =
            `order_${crypto.randomBytes(8).toString('hex')}`;

        const internal_order_id =
            crypto.randomBytes(16).toString('hex');

        // CASHFREE ORDER PAYLOAD
        const orderData = {

            order_id,

            order_amount: Number(amount),

            order_currency: currency || 'INR',

            customer_details: {

                customer_id:
                    `cust_${crypto.randomBytes(6).toString('hex')}`,

                customer_phone:
                    mobile_no || '9999999999'

            }

        };

        // CREATE ORDER IN CASHFREE
        const response = await fetch(
            `${CASHFREE_BASE_URL}/orders`,
            {
                method: 'POST',
                headers: cashfreeHeaders(),
                body: JSON.stringify(orderData)
            }
        );

        const data = await response.json();

        // CASHFREE FAILURE
        if (!response.ok) {

            return res.status(400).json({

                message: 'Failed to create Cashfree order',

                error: data

            });

        }

        // STORE PAYMENT RECORD
        const new_payment = await payment_model.create({

            internal_order_id,

            user: user_id,

            cf_order_id: data.cf_order_id,

            order_id,

            amount: Number(amount),

            currency: currency || 'INR',

            payment_session_id: data.payment_session_id,

            used: false

        });

        // SUCCESS RESPONSE
        return res.status(200).json({

            success: true,

            message: 'Payment order created successfully',

            internal_order_id,

            order_id,

            cf_order_id: data.cf_order_id,

            payment_session_id: data.payment_session_id,

            amount: Number(amount),

            currency: currency || 'INR'

        });

    }

    catch (error) {

        console.error('Create Payment Error:', error);

        return res.status(500).json({

            success: false,

            message: 'Failed to create payment order'

        });

    }

});



/*
========================================
VERIFY PAYMENT
========================================
*/

const verify_payment = expressAsyncHandler(async (req, res) => {

    try {

        const {
            order_id,
            internal_order_id,
            cf_order_id
        } = req.body;

        // AUTH CHECK
        if (!req.user || !req.user.id) {

            return res.status(401).json({
                message: 'Unauthorized'
            });

        }

        const user_id = req.user.id;

        // REQUIRED FIELD VALIDATION
        if (
            !order_id ||
            !internal_order_id ||
            !cf_order_id
        ) {

            return res.status(400).json({

                message: 'Missing required fields'

            });

        }

        // FETCH PAYMENT RECORD
        const payment_status =
            await payment_model.findOne({
                internal_order_id
            });

        // PAYMENT RECORD NOT FOUND
        if (!payment_status) {

            return res.status(404).json({

                message: 'Payment record not found'

            });

        }

        // USER OWNERSHIP VALIDATION
        if (
            payment_status.user.toString() !==
            user_id.toString()
        ) {

            return res.status(403).json({

                message:
                    'Unauthorized to verify this payment'

            });

        }

        // PREVENT DUPLICATE VERIFICATION
        if (payment_status.status === 'completed') {

            return res.status(400).json({

                message:
                    'Payment already verified'

            });

        }

        // ORDER VALIDATION
        if (payment_status.order_id !== order_id) {

            return res.status(400).json({

                message: 'Order ID mismatch'

            });

        }

        // CASHFREE ORDER VALIDATION
        if (
            payment_status.cf_order_id !== cf_order_id
        ) {

            return res.status(400).json({

                message: 'Cashfree Order ID mismatch'

            });

        }

        // VERIFY FROM CASHFREE
        const response = await fetch(
            `${CASHFREE_BASE_URL}/orders/${cf_order_id}`,
            {
                method: 'GET',
                headers: cashfreeHeaders()
            }
        );

        // CASHFREE FETCH FAILED
        if (!response.ok) {

            return res.status(400).json({

                message:
                    'Failed to fetch payment status'

            });

        }

        const data = await response.json();

        // PAYMENT SUCCESS
        if (data.order_status === 'PAID') {

            payment_status.status = 'completed';

            await payment_status.save();

            return res.status(200).json({

                success: true,

                message:
                    'Payment verified successfully',

                data: {

                    order_status: data.order_status,

                    cf_order_id: data.cf_order_id

                }

            });

        }

        // PAYMENT NOT COMPLETED
        return res.status(400).json({

            success: false,

            message: 'Payment not completed',

            order_status: data.order_status

        });

    }

    catch (error) {

        console.error('Verify Payment Error:', error);

        return res.status(500).json({

            success: false,

            message: 'Failed to verify payment'

        });

    }

});


module.exports = {
    create_payment,
    verify_payment
};