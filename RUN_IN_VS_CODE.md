# Run ParkingSpot in VS Code (Windows)

1. Extract this ZIP into a new folder. In VS Code choose **File > Open Folder** and select the folder containing `package.json` and `server.ts`.
2. Open **Terminal > New Terminal** (PowerShell) and run:

   ```powershell
   node --version
   npm ci
   npm run dev
   ```

3. Open <http://localhost:3000>. To check the API, open <http://localhost:3000/api/facilities?city=Chennai> and confirm it returns a nonempty `facilities` array.

You do not need MongoDB or a Gemini key to see the included sample facilities locally. Leave `VITE_API_ORIGIN` unset for local development so the frontend calls the backend on the same port. Data stored in memory resets when the server stops.

If port 3000 is already in use, restart in PowerShell with:

```powershell
$env:PORT=3001
npm run dev
```

Then visit <http://localhost:3001>.
