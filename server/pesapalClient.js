const tokenCache = {
    token: null,
    expiresAt: 0
};

const getBaseUrl = () => {
    const override = process.env.PESAPAL_BASE_URL;
    if (override) {
        return override.replace(/\/$/, '');
    }

    const env = (process.env.PESAPAL_ENV || 'sandbox').toLowerCase();
    if (env === 'production' || env === 'prod') {
        return 'https://pay.pesapal.com/v3';
    }
    return 'https://cybqa.pesapal.com/pesapalv3';
};

const requestToken = async () => {
    const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
        throw new Error('Missing PESAPAL_CONSUMER_KEY or PESAPAL_CONSUMER_SECRET');
    }

    const response = await fetch(`${getBaseUrl()}/api/Auth/RequestToken`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            consumer_key: consumerKey,
            consumer_secret: consumerSecret
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Pesapal auth failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    if (!data || !data.token) {
        throw new Error('Pesapal auth response missing token');
    }

    return data.token;
};

const getAuthToken = async () => {
    const now = Date.now();
    if (tokenCache.token && tokenCache.expiresAt > now) {
        return tokenCache.token;
    }

    const token = await requestToken();
    tokenCache.token = token;
    tokenCache.expiresAt = now + 4.5 * 60 * 1000;
    return token;
};

const pesapalRequest = async (path, options = {}) => {
    const token = await getAuthToken();
    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    const response = await fetch(`${getBaseUrl()}${path}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Pesapal request failed (${response.status}): ${text}`);
    }

    return response.json();
};

const submitOrderRequest = async (payload) => {
    return pesapalRequest('/api/Transactions/SubmitOrderRequest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
};

const getTransactionStatus = async (orderTrackingId) => {
    const params = new URLSearchParams({ orderTrackingId });
    return pesapalRequest(`/api/Transactions/GetTransactionStatus?${params.toString()}`, {
        method: 'GET'
    });
};

module.exports = {
    getBaseUrl,
    submitOrderRequest,
    getTransactionStatus
};
