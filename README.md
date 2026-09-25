# ParkingSpot

Parking, bike parking, and EV charging demo built with React, Vite, Express, and Socket.IO. The example facilities include Chennai zones.

## Run locally

Requires Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The development server serves both the frontend and `/api` routes. Check `http://localhost:3000/api/health` and `http://localhost:3000/api/facilities?city=Chennai` if search does not load.

## Deploy to Vercel

Import this repository as a Vite project. `vercel.json` builds the frontend and routes `/api/*` to the Express handler in `api/handler.ts`; the frontend calls that handler on the same origin. **Remove any old `VITE_API_ORIGIN` value** from the Vercel project's environment settings and redeploy, unless you intentionally run a separate Express backend.

After deployment, open `/api/health` and `/api/facilities?city=Chennai` on the deployed domain. Both should return JSON. The Chennai response should contain five demo facilities.

Authentication requires `JWT_SECRET` (a unique secret) and `ADMIN_PASSWORD` in Vercel's server environment. Set `ADMIN_EMAIL` to your own administrator email before using the admin portal. Do not commit these values to Git. The public facilities endpoint works even when authentication has not yet been configured.

**Demo data limitation:** The current `parkingStore` keeps users, bookings, facilities, and slots in process memory. They can reset when a Vercel Function is recycled; `MONGODB_URI` currently connects Mongoose but does not persist `parkingStore` records. Do not treat this as a production reservation or payment system. For live bookings, implement persistent CRUD, payment verification, and consistent slot locking before accepting users or payments.

See [VERCEL_DEPLOY_GUIDE.md](VERCEL_DEPLOY_GUIDE.md) for the deployment checklist and the optional separate server setup.
