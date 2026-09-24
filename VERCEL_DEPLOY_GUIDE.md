# ParkingSpot deployment checklist

## Fix for “Could not load parking facilities”

The Vercel frontend previously sent `/api/facilities` to its static SPA fallback. That returned a text/HTML page, so the client failed to parse it as JSON. The repository now contains `api/handler.ts` and an API rewrite in `vercel.json`. Public facility data loads without another hosting account.

1. Push **this revision** of the repository to the branch connected to the Vercel project. A redeploy of the old repository will keep the error.
2. In Vercel Project Settings → Environment Variables, remove `VITE_API_ORIGIN` if it points to localhost, the frontend URL, or a backend that does not serve JSON. This project uses its own `/api` route by default. Environment changes require a new deployment.
3. Confirm the Vercel project root is the repository root, Framework Preset is Vite, Build Command is `npm run build`, and Output Directory is `dist`. Redeploy the updated commit.
4. Open `https://YOUR-VERCEL-DOMAIN/api/health` and `https://YOUR-VERCEL-DOMAIN/api/facilities?city=Chennai`. They must return JSON; the second response should contain five sample facilities. Then reload the site and test search for Velachery.

If the API returns a page or a 404, check that `api/handler.ts` and `vercel.json` are in the deployed commit and the project root is correct. If the frontend still calls another domain, remove `VITE_API_ORIGIN` and redeploy. If the API returns a 500, inspect Vercel Function logs.

## Authentication

For login and registration on Vercel, configure the following server environment variables, then redeploy:

- `JWT_SECRET`: a unique, random secret (never commit it).
- `ADMIN_PASSWORD`: a unique strong admin password.
- `ADMIN_EMAIL`: your own admin email.
- `GEMINI_API_KEY`: only if using ParkBot.

Until the first two are configured, the API intentionally returns JSON 503 for private operations while public facility search remains available. No local `.env` or credentials should be uploaded to GitHub.

## Important data limitation

This app currently stores users, bookings, slots, and facilities in JavaScript Maps. Even when `MONGODB_URI` is set, `parkingStore` does not write those records to MongoDB. Vercel Function instances can restart or scale independently, so accounts, bookings, and slot changes are **temporary demo data**. The same limitation applies to the optional Render server on restart. The payment flow includes demo behavior; do not enable live payments or treat a displayed reservation as durable until database CRUD, atomic slot locking, and payment handling are implemented and checked.

## Optional separate Node backend

For Socket.IO in this codebase, a persistent Node server is still available through `npm start` and `render.yaml`. Its `/api/health` and `/api/facilities?city=Chennai` endpoints must return JSON. Set `FRONTEND_URL` on that server to the exact Vercel frontend origin. Set `VITE_API_ORIGIN` in Vercel to the server origin **without `/api`**, then redeploy. A separate server does not by itself make in-memory records persistent.
