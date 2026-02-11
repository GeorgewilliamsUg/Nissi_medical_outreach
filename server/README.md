# Pesapal IPN Server

This folder contains a minimal Node/Express backend that validates Pesapal IPN and callback events before marking a donation as successful.

## Requirements
- Node.js 18+ (uses the built-in `fetch` API).

## Environment Variables

Required:
- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_IPN_ID` (the notification ID returned when you register your IPN URL)
- `BASE_URL` or `PESAPAL_CALLBACK_URL` (used to generate the callback URL)

Optional:
- `PESAPAL_ENV` (`sandbox` or `production`)
- `PESAPAL_BASE_URL` (override the API base URL)
- `PESAPAL_CURRENCY` (default `USD`)
- `PESAPAL_DESCRIPTION`
- `THANK_YOU_URL` (default `/thank-you.html`)
- `CANCEL_URL` (default `/donate.html?status=failed`)

## Endpoints
- `POST /api/create-order` – creates a Pesapal order and returns `checkout_url`.
- `GET|POST /api/pesapal/ipn` – handles IPN notifications, verifies status/amount/currency/reference, and responds with status 200.
- `GET /api/pesapal/callback` – verifies the order and redirects the donor to `thank-you.html`.

## Notes
- The in-memory donation store is for demonstration. Replace it with a real database before going live.
- The receipt sender is a stub. Wire it to your email provider of choice.
