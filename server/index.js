const express = require('express');
const crypto = require('crypto');
const {
    submitOrderRequest,
    getTransactionStatus
} = require('./pesapalClient');
const store = require('./donationStore');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || '';
const THANK_YOU_URL = process.env.THANK_YOU_URL || '/thank-you.html';
const CANCEL_URL = process.env.CANCEL_URL || '/donate.html?status=failed';
const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL || (BASE_URL ? `${BASE_URL}/api/pesapal/callback` : null);
const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID;
const DEFAULT_CURRENCY = process.env.PESAPAL_CURRENCY || 'USD';
const DEFAULT_DESCRIPTION = process.env.PESAPAL_DESCRIPTION || 'Donation to Nissi Medical Outreach';

const normalizeAmount = (value) => {
    return store.normalizeAmount(value);
};

const normalizeStatus = (value) => {
    if (!value) {
        return '';
    }
    return String(value).trim().toUpperCase();
};

const extractNotification = (req) => {
    const source = Object.assign({}, req.query, req.body);
    const orderTrackingId = source.OrderTrackingId || source.orderTrackingId || source.order_tracking_id;
    const merchantReference = source.OrderMerchantReference || source.MerchantReference || source.orderMerchantReference || source.merchant_reference;
    const notificationType = source.OrderNotificationType || source.NotificationType || source.orderNotificationType;

    return {
        orderTrackingId,
        merchantReference,
        notificationType
    };
};

const sendReceipt = async (donation, statusData) => {
    if (!donation || !donation.email) {
        return;
    }

    // TODO: integrate with your email provider (SendGrid, Postmark, etc.).
    console.log(`Receipt queued for ${donation.email}`, {
        merchantReference: donation.merchantReference,
        amount: donation.amount,
        currency: donation.currency,
        trackingId: donation.orderTrackingId,
        status: statusData?.payment_status_description
    });
};

const verifyTransaction = async ({ orderTrackingId, merchantReference }) => {
    const status = await getTransactionStatus(orderTrackingId);
    const paymentStatus = normalizeStatus(status.payment_status_description || status.payment_status);
    const amount = normalizeAmount(status.amount);
    const currency = status.currency ? String(status.currency).toUpperCase() : null;
    const statusReference = status.merchant_reference || status.order_merchant_reference || status.merchantReference;

    let donation = store.getDonationByReference(merchantReference);
    if (!donation) {
        donation = store.getDonationByTrackingId(orderTrackingId);
    }

    if (!donation) {
        return { ok: false, reason: 'Unknown merchant reference' };
    }

    if (statusReference && donation.merchantReference !== statusReference) {
        return { ok: false, reason: 'Merchant reference mismatch' };
    }

    const expectedAmount = normalizeAmount(donation.amount);
    if (expectedAmount === null || amount === null || expectedAmount !== amount) {
        return { ok: false, reason: 'Amount mismatch' };
    }

    if (donation.currency && currency && donation.currency.toUpperCase() !== currency.toUpperCase()) {
        return { ok: false, reason: 'Currency mismatch' };
    }

    if (paymentStatus !== 'COMPLETED') {
        return { ok: false, reason: `Payment not completed (${paymentStatus || 'UNKNOWN'})` };
    }

    return { ok: true, donation, status };
};

app.post('/api/create-order', async (req, res) => {
    try {
        const {
            amount,
            currency,
            description,
            first_name: firstName,
            last_name: lastName,
            email,
            phone_number: phoneNumber,
            country_code: countryCode
        } = req.body;

        const normalizedAmount = normalizeAmount(amount);
        if (!normalizedAmount || normalizedAmount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        if (!PESAPAL_CALLBACK_URL) {
            return res.status(500).json({ error: 'Missing PESAPAL_CALLBACK_URL or BASE_URL' });
        }

        if (!PESAPAL_IPN_ID) {
            return res.status(500).json({ error: 'Missing PESAPAL_IPN_ID' });
        }

        const merchantReference = `NMO-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

        const payload = {
            id: merchantReference,
            currency: (currency || DEFAULT_CURRENCY).toUpperCase(),
            amount: normalizedAmount,
            description: description || DEFAULT_DESCRIPTION,
            callback_url: PESAPAL_CALLBACK_URL,
            notification_id: PESAPAL_IPN_ID,
            billing_address: {
                first_name: firstName || 'Donor',
                last_name: lastName || 'Supporter',
                email_address: email
            }
        };

        if (phoneNumber) {
            payload.billing_address.phone_number = phoneNumber;
        }
        if (countryCode) {
            payload.billing_address.country_code = countryCode;
        }

        const response = await submitOrderRequest(payload);

        const orderTrackingId = response.order_tracking_id;
        const redirectUrl = response.redirect_url;

        if (!orderTrackingId || !redirectUrl) {
            return res.status(502).json({ error: 'Missing checkout URL from Pesapal' });
        }

        store.createDonation({
            merchantReference,
            amount: normalizedAmount,
            currency: payload.currency,
            email,
            firstName,
            lastName
        });

        store.linkTrackingId(merchantReference, orderTrackingId);

        return res.json({
            checkout_url: redirectUrl,
            order_tracking_id: orderTrackingId,
            merchant_reference: merchantReference
        });
    } catch (error) {
        console.error('Create order error:', error);
        return res.status(500).json({ error: 'Failed to create order' });
    }
});

const handleIpn = async (req, res) => {
    try {
        const { orderTrackingId, merchantReference, notificationType } = extractNotification(req);

        if (!orderTrackingId || !merchantReference) {
            return res.status(400).json({ error: 'Missing OrderTrackingId or MerchantReference' });
        }

        const notification = normalizeStatus(notificationType);
        if (notification && notification !== 'IPNCHANGE') {
            return res.status(400).json({ error: `Unexpected notification type: ${notification}` });
        }

        const result = await verifyTransaction({ orderTrackingId, merchantReference });
        if (!result.ok) {
            return res.status(400).json({ error: result.reason });
        }

        if (result.donation.status !== 'COMPLETED') {
            store.updateDonation(result.donation.merchantReference, {
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                orderTrackingId
            });
            await sendReceipt(result.donation, result.status);
        }

        return res.status(200).json({
            orderNotificationType: notification || 'IPNCHANGE',
            orderTrackingId,
            orderMerchantReference: merchantReference,
            status: 200
        });
    } catch (error) {
        console.error('IPN error:', error);
        return res.status(500).json({ error: 'Failed to process IPN' });
    }
};

const handleCallback = async (req, res) => {
    try {
        const { orderTrackingId, merchantReference, notificationType } = extractNotification(req);

        if (!orderTrackingId) {
            return res.redirect(CANCEL_URL);
        }

        const notification = normalizeStatus(notificationType);
        if (notification && notification !== 'CALLBACKURL') {
            return res.redirect(CANCEL_URL);
        }

        const result = await verifyTransaction({ orderTrackingId, merchantReference });
        if (!result.ok) {
            return res.redirect(CANCEL_URL);
        }

        if (result.donation.status !== 'COMPLETED') {
            store.updateDonation(result.donation.merchantReference, {
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                orderTrackingId
            });
            await sendReceipt(result.donation, result.status);
        }

        return res.redirect(THANK_YOU_URL);
    } catch (error) {
        console.error('Callback error:', error);
        return res.redirect(CANCEL_URL);
    }
};

app.get('/api/pesapal/ipn', handleIpn);
app.post('/api/pesapal/ipn', handleIpn);
app.get('/api/pesapal/callback', handleCallback);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Pesapal IPN server running on port ${PORT}`);
});
