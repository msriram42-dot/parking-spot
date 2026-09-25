# ParkingSpot: enable authentication on Vercel

Your existing `api/handler.ts` returns `Authentication is not configured on the server.` when the production deployment is missing a unique `JWT_SECRET` or `ADMIN_PASSWORD`. This is a deployment setting; copying this file into GitHub will not set those values.

1. Open Vercel Dashboard > ParkingSpot project > Settings > Environment Variables.
2. Add these variables for **Production**:

   | Name | Value |
   | --- | --- |
   | `JWT_SECRET` | A new random secret; do not use `parkingspot_super_secret_jwt_key_2026`. |
   | `ADMIN_PASSWORD` | A strong password you choose for administrator login. |
   | `ADMIN_EMAIL` | Your own administrator email address. |

   Generate the secret in PowerShell with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Paste the generated output as the `JWT_SECRET` value, without quotation marks. If you use a Vercel Preview deployment to test login, add the same variable names to **Preview** as well; you may choose different secret values there.

3. Save the variables, then redeploy the latest production deployment. Environment changes take effect on new deployments.
4. Visit `https://YOUR-VERCEL-DOMAIN/api/health` to verify that the API returns JSON, then try registration or login again.

Keep the actual secret and password in Vercel settings. Do not place them in this ZIP or commit them to GitHub.
