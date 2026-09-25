/**
 * End-to-End Verification Test Suite
 * Covers:
 *  - Registration (valid & invalid inputs)
 *  - Login (valid & invalid credentials, role restrictions)
 *  - Administrator Dedicated Login & RBAC server-side gating
 *  - Password reset flow end-to-end (token, validation, update)
 *  - Logout & Session Token Revocation
 *  - Protected route access (blocking unauthorized direct access)
 *  - Chennai zones & facilities verification
 */

import http from 'http';
import express from 'express';
import authRoutes from '../src/server/routes/auth.ts';
import adminRoutes from '../src/server/routes/admin.ts';
import facilitiesRoutes from '../src/server/routes/facilities.ts';
import analyticsRoutes from '../src/server/routes/analytics.ts';
import { parkingStore } from '../src/server/store.ts';

// Test runner helper
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

async function request(serverUrl: string, path: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}) {
  const url = `${serverUrl}${path}`;
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const status = res.status;
  let data: any = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status, data };
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🚀 Running ParkingSpot Auth & Security Test Suite');
  console.log('======================================================\n');

  // Spin up test server on an ephemeral port
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/facilities', facilitiesRoutes);
  app.use('/api/analytics', analyticsRoutes);

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  try {
    // -------------------------------------------------------------
    // 1. REGISTRATION TESTS
    // -------------------------------------------------------------
    console.log('🔹 1. User Registration Flow:');

    // 1.1 Invalid registration - missing fields
    const regInvalid = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: { name: '', email: '', password: '' }
    });
    assert(regInvalid.status === 400, 'Rejects registration with empty fields');

    // 1.2 Invalid registration - password too short (< 6 chars)
    const regShortPass = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: { name: 'Test User', email: 'test_short@example.com', password: '123' }
    });
    assert(regShortPass.status === 400, 'Rejects password shorter than 6 characters');

    // 1.3 Invalid registration - attempting self-registration as admin
    const regAdminAttempt = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: { name: 'Hacker', email: 'hacker@example.com', password: 'password123', role: 'admin' }
    });
    assert(regAdminAttempt.status === 403, 'Blocks self-registration of administrator role');

    // 1.4 Valid registration
    const testEmail = `commuter_${Date.now()}@test.com`;
    const regValid = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Siddharth V',
        email: testEmail,
        password: 'ValidPassword2026!',
        role: 'commuter',
        vehicleNumber: 'TN-01-AX-9999',
        vehicleType: 'car'
      }
    });
    assert(regValid.status === 201 && regValid.data?.token, 'Creates user and returns JWT token');
    const commuterToken = regValid.data?.token;

    // 1.5 Duplicate email registration
    const regDup = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Another User',
        email: testEmail,
        password: 'AnotherPassword123'
      }
    });
    assert(regDup.status === 409, 'Rejects duplicate registration with HTTP 409');

    // -------------------------------------------------------------
    // 2. LOGIN TESTS
    // -------------------------------------------------------------
    console.log('\n🔹 2. User & Admin Login Flow:');

    // 2.1 Invalid password
    const loginBadPass = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'WrongPassword!' }
    });
    assert(loginBadPass.status === 401, 'Rejects invalid password with HTTP 401');

    // 2.2 Valid user login
    const loginValid = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'ValidPassword2026!' }
    });
    assert(loginValid.status === 200 && loginValid.data?.user?.email === testEmail, 'Authenticates valid user login');

    // 2.3 Admin user blocked from standard user login route
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@parkingspot.ai').toLowerCase();
    const adminStandardLogin = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: process.env.ADMIN_PASSWORD || 'AdminSecure2026!#' }
    });
    assert(adminStandardLogin.status === 403, 'Rejects administrator from standard login (must use Admin Portal)');

    // 2.4 Dedicated Administrator Login route
    const adminDedicatedLogin = await request(baseUrl, '/api/auth/admin-login', {
      method: 'POST',
      body: { email: adminEmail, password: process.env.ADMIN_PASSWORD || 'AdminSecure2026!#' }
    });
    assert(adminDedicatedLogin.status === 200 && adminDedicatedLogin.data?.user?.role === 'admin', 'Dedicated Admin Login grants session to verified administrator');
    const adminToken = adminDedicatedLogin.data?.token;

    // -------------------------------------------------------------
    // 3. SERVER-SIDE RBAC & DIRECT ACCESS PROTECTION
    // -------------------------------------------------------------
    console.log('\n🔹 3. Server-Side RBAC & Route Gating:');

    // 3.1 Unauthenticated access to /api/admin/users
    const unauthAdmin = await request(baseUrl, '/api/admin/users');
    assert(unauthAdmin.status === 401, 'Blocks unauthenticated direct access to /api/admin/users');

    // 3.2 Commuter token attempting to access /api/admin/users
    const commuterOnAdmin = await request(baseUrl, '/api/admin/users', {
      headers: { Authorization: `Bearer ${commuterToken}` }
    });
    assert(commuterOnAdmin.status === 403, 'Blocks commuter token from /api/admin/users with HTTP 403');

    // 3.3 Commuter token attempting to access /api/analytics/platform
    const commuterOnAnalytics = await request(baseUrl, '/api/analytics/platform', {
      headers: { Authorization: `Bearer ${commuterToken}` }
    });
    assert(commuterOnAnalytics.status === 403, 'Blocks commuter token from /api/analytics/platform');

    // 3.4 Admin token successfully accesses /api/admin/users
    const adminOnAdmin = await request(baseUrl, '/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminOnAdmin.status === 200 && Array.isArray(adminOnAdmin.data?.users), 'Admin token grants access to /api/admin/users');

    // 3.5 Admin token accesses Platform Analytics with real MongoDB/store counts
    const adminOnAnalytics = await request(baseUrl, '/api/analytics/platform', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminOnAnalytics.status === 200 &&
      typeof adminOnAnalytics.data?.analytics?.carSpaces === 'number' &&
      typeof adminOnAnalytics.data?.analytics?.bikeSpaces === 'number' &&
      typeof adminOnAnalytics.data?.analytics?.evChargingStations === 'number',
      'Platform analytics returns real categorized counts (Car, Bike, EV Charging stations)'
    );

    // -------------------------------------------------------------
    // 4. PASSWORD RESET FLOW (END-TO-END)
    // -------------------------------------------------------------
    console.log('\n🔹 4. Password Recovery Flow End-to-End:');

    // 4.1 Forgot password request for non-existent email
    const forgotNonExistent = await request(baseUrl, '/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'nonexistent_account_xyz@test.com' }
    });
    assert(forgotNonExistent.status === 404, 'Returns honest 404 for non-existent account recovery');

    // 4.2 Forgot password request for valid account
    const forgotValid = await request(baseUrl, '/api/auth/forgot-password', {
      method: 'POST',
      body: { email: testEmail }
    });
    assert(
      forgotValid.status === 200 && (forgotValid.data?.resetToken || forgotValid.data?.emailDeliveryConfigured !== undefined),
      'Generates time-limited reset token and surfaces honest delivery status'
    );
    const resetToken = forgotValid.data?.resetToken;

    // 4.3 Verify reset token
    if (resetToken) {
      const verifyToken = await request(baseUrl, `/api/auth/verify-reset-token/${resetToken}`);
      assert(verifyToken.status === 200 && verifyToken.data?.valid === true, 'Verifies valid reset token');

      // 4.4 Reset password with new password
      const resetPassRes = await request(baseUrl, '/api/auth/reset-password', {
        method: 'POST',
        body: { token: resetToken, newPassword: 'BrandNewPassword2026!' }
      });
      assert(resetPassRes.status === 200, 'Consumes single-use token and updates password');

      // 4.5 Attempting to reuse the single-use token
      const reuseTokenRes = await request(baseUrl, '/api/auth/reset-password', {
        method: 'POST',
        body: { token: resetToken, newPassword: 'AnotherPassword!' }
      });
      assert(reuseTokenRes.status === 400, 'Rejects reused single-use token');

      // 4.6 Log in with new password
      const loginNewPass = await request(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: 'BrandNewPassword2026!' }
      });
      assert(loginNewPass.status === 200, 'Logs in successfully with the newly reset password');
    }

    // -------------------------------------------------------------
    // 5. LOGOUT & SESSION INVALIDATION
    // -------------------------------------------------------------
    console.log('\n🔹 5. Logout & Session Invalidation:');

    // Log in to get fresh token
    const freshLogin = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'BrandNewPassword2026!' }
    });
    const freshToken = freshLogin.data?.token;

    // Call logout endpoint
    const logoutRes = await request(baseUrl, '/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshToken}` }
    });
    assert(logoutRes.status === 200 && logoutRes.data?.success, 'Logs out and revokes token');

    // Attempt to use revoked token on /api/auth/me
    const accessWithRevoked = await request(baseUrl, '/api/auth/me', {
      headers: { Authorization: `Bearer ${freshToken}` }
    });
    assert(accessWithRevoked.status === 401, 'Revoked token is rejected on subsequent API requests');

    // -------------------------------------------------------------
    // 6. CHENNAI DATA & SEARCH INTEGRATION
    // -------------------------------------------------------------
    console.log('\n🔹 6. Chennai Zones & Facilities Search:');

    const facilitiesRes = await request(baseUrl, '/api/facilities?city=Chennai');
    assert(facilitiesRes.status === 200, 'Fetches facilities for Chennai');

    const facilities: any[] = facilitiesRes.data?.facilities || [];
    const chennaiAreas = ['Anna Nagar', 'T. Nagar', 'Velachery', 'Tambaram', 'OMR'];
    const areasRepresented = chennaiAreas.filter(area => 
      facilities.some(f => f.area === area || (f.address && f.address.includes(area)))
    );

    assert(
      areasRepresented.length >= 4,
      `Chennai facilities cover requested zones (${areasRepresented.join(', ')})`
    );

    // Search query test
    const searchRes = await request(baseUrl, '/api/facilities?query=Velachery');
    assert(
      searchRes.status === 200 && searchRes.data?.facilities?.length > 0,
      'Search query for "Velachery" returns matching facility'
    );

  } finally {
    server.close();
  }

  console.log('\n======================================================');
  console.log(`🏁 Test Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
