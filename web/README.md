# AgriNova Web

This is the visual frontend for the AgriNova MVP. It connects to the Express backend and currently supports:

- Buyer and farmer account creation
- Login with JWT-backed backend auth
- Live listing discovery
- Farmer farm creation
- Farmer listing publication
- Buyer order placement
- Paystack checkout handoff

## Setup

1. Copy `.env.example` to `.env.local`
2. Confirm `NEXT_PUBLIC_API_BASE_URL` points to the backend
3. Install dependencies with `npm install`
4. Run with `npm run dev`

The app starts on `http://localhost:3000`.
