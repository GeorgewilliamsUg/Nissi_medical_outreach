const donationsByReference = new Map();
const referenceByTrackingId = new Map();

const normalizeAmount = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return null;
    }
    return Number(num.toFixed(2));
};

const createDonation = ({
    merchantReference,
    amount,
    currency,
    email,
    firstName,
    lastName,
    orderTrackingId
}) => {
    const donation = {
        merchantReference,
        amount,
        currency,
        email,
        firstName,
        lastName,
        orderTrackingId: orderTrackingId || null,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    donationsByReference.set(merchantReference, donation);

    if (orderTrackingId) {
        referenceByTrackingId.set(orderTrackingId, merchantReference);
    }

    return donation;
};

const linkTrackingId = (merchantReference, orderTrackingId) => {
    const donation = donationsByReference.get(merchantReference);
    if (!donation) {
        return null;
    }

    donation.orderTrackingId = orderTrackingId;
    referenceByTrackingId.set(orderTrackingId, merchantReference);
    return donation;
};

const getDonationByReference = (merchantReference) => {
    if (!merchantReference) {
        return null;
    }
    return donationsByReference.get(merchantReference) || null;
};

const getDonationByTrackingId = (orderTrackingId) => {
    if (!orderTrackingId) {
        return null;
    }
    const reference = referenceByTrackingId.get(orderTrackingId);
    if (!reference) {
        return null;
    }
    return donationsByReference.get(reference) || null;
};

const updateDonation = (merchantReference, updates) => {
    const donation = donationsByReference.get(merchantReference);
    if (!donation) {
        return null;
    }
    Object.assign(donation, updates);
    return donation;
};

module.exports = {
    normalizeAmount,
    createDonation,
    linkTrackingId,
    getDonationByReference,
    getDonationByTrackingId,
    updateDonation
};
