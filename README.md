# AgriNova Backend MVP

This is a lean Express + MySQL starter for the first marketplace loop of the smart agriculture platform:

1. Farmers register
2. Users log in and receive JWT tokens
3. Farms and products are created
4. Farmers publish listings
5. Buyers place orders
6. Paystack payments are initialized and tracked
7. Deliveries are updated through completion

## Stack

- Node.js
- Express
- MySQL 8+
- JWT authentication
- Paystack transaction initialization and verification

## Project Structure

- `database/001_mvp_schema.sql` - initial MySQL schema
- `database/002_listing_images.sql` - image table migration for listing uploads
- `src/app.js` - Express app setup
- `src/server.js` - server entrypoint
- `src/config/` - environment and database config
- `src/controllers/` - route handlers
- `src/routes/` - API routing
- `docs/api-examples.md` - sample request payloads for the MVP flow
- `web/` - Next.js frontend for local farmer and buyer flows

## Setup

1. Copy `.env.example` to `.env`
2. Create a MySQL database named `smart_agriculture`
3. Run the schema in `database/001_mvp_schema.sql`
4. Install dependencies with `npm install`
5. Start the API with `npm run dev`
6. Register a user and log in to get a Bearer token for protected routes

## Frontend Setup

1. Open `web/`
2. Copy `web/.env.example` to `web/.env.local`
3. Run `npm install`
4. Start the frontend with `npm run dev`
5. Open `http://localhost:3000`

## One Command Start

Run both backend and frontend together from the project root:

```powershell
npm run start:local
```

Stop both tracked processes with:

```powershell
npm run stop:local
```

Runtime logs are written to `.local-dev/`.

## Current Product Features

- Farmer and buyer registration/login
- Marketplace browsing
- Orders and Paystack checkout start
- Buyer and seller dashboard sections
- Product listing upload from device with up to 5 images

## MVP API Surface

### Health

- `GET /api/v1/health`

### Users

- `POST /api/v1/users/register`
- `POST /api/v1/users/login`
- `GET /api/v1/users/:id`

### Farms

- `POST /api/v1/farms`
- `GET /api/v1/farms?farmerId=1`

### Products

- `POST /api/v1/products`
- `GET /api/v1/products`

### Listings

- `POST /api/v1/listings`
- `GET /api/v1/listings`
- `GET /api/v1/listings/:id`

### Orders

- `POST /api/v1/orders`
- `GET /api/v1/orders/:id`
- `PATCH /api/v1/orders/:id/status`

### Payments

- `POST /api/v1/payments/initialize`
- `GET /api/v1/payments/verify/:reference`
- `PATCH /api/v1/payments/:id/status`
- `POST /api/v1/payments/webhook/paystack`

### Deliveries

- `POST /api/v1/deliveries`
- `PATCH /api/v1/deliveries/:id/status`

## Suggested Next Steps

- Add SMS or WhatsApp notifications for order/payment/delivery updates
- Build a buyer and farmer dashboard in Next.js
- Add M-Pesa as the second payment rail for Kenya-scale adoption
