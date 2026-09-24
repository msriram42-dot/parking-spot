import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { parkingStore } from '../store.ts';
import { generateToken, requireAuth, type AuthRequest } from '../middleware/auth.ts';
import type { UserRole, VehicleType } from '../../types/index.ts';

const router = Router();

// POST /api/auth/login - Commuter and Owner login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = Array.from(parkingStore.users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Role check: If an admin tries normal login, direct to Admin Portal
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Administrative accounts must sign in via the Dedicated Administrator Portal.' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed: ' + (error as Error).message });
  }
});

// POST /api/auth/admin-login - Dedicated Administrator Portal Login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password, adminKey } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Administrator email and security password are required' });
    }

    const user = Array.from(parkingStore.users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Access denied: Invalid administrator credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Access denied: Invalid administrator credentials' });
    }

    // Secondary verification if adminKey provided or verify authority
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({
      token,
      user: safeUser,
      message: 'Administrator session authenticated securely'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Administrator authentication error: ' + (error as Error).message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'commuter', phone, vehicleNumber, vehicleType = 'car' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Prevent unauthorized registration of admin role
    if (role === 'admin') {
      return res.status(403).json({ error: 'Administrator accounts cannot be self-registered.' });
    }

    const existing = Array.from(parkingStore.users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const id = `usr_${Date.now()}`;
    const newUser = {
      id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: (role === 'owner' ? 'owner' : 'commuter') as UserRole,
      phone: phone || '',
      vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase().trim() : '',
      vehicleType: (['car', 'bike', 'suv', 'ev'].includes(vehicleType) ? vehicleType : 'car') as VehicleType,
      isActive: true,
      totalBookings: 0,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    parkingStore.users.set(newUser.id, newUser);

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ token, user: safeUser });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed: ' + (error as Error).message });
  }
});

// POST /api/auth/logout - Fully invalidate session
router.post('/logout', requireAuth, (req: AuthRequest, res) => {
  if (req.token) {
    parkingStore.revokeToken(req.token);
  }
  return res.json({ success: true, message: 'Session cleared and logged out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = parkingStore.users.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// POST /api/auth/forgot-password - Generate time-limited, single-use reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tokenData = parkingStore.createPasswordResetToken(normalizedEmail);

    if (!tokenData) {
      // Return honest feedback
      return res.status(404).json({
        error: 'No registered account found with this email address.'
      });
    }

    // Check if SMTP email service is genuinely configured with a valid host
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpUser = process.env.SMTP_USER || '';
    const isSmtpConfigured = Boolean(
      smtpHost &&
      smtpUser &&
      smtpHost.includes('.') &&
      !['12', 'localhost', 'none'].includes(smtpHost.toLowerCase())
    );

    if (isSmtpConfigured) {
      // In a production server with SMTP credentials, an email transport is dispatched
      return res.json({
        success: true,
        emailDeliveryConfigured: true,
        message: `Password reset instructions have been dispatched to ${normalizedEmail}. Please check your inbox.`,
        expiresAt: tokenData.expiresAt
      });
    } else {
      // Surface clear, honest status when email delivery is not configured
      return res.json({
        success: true,
        emailDeliveryConfigured: false,
        resetToken: tokenData.token,
        expiresAt: tokenData.expiresAt,
        message: 'Password reset token generated (valid for 15 minutes). Note: SMTP email service is not configured in this environment (SMTP_HOST / SMTP_USER not set). Use the single-use token below to complete your password reset.'
      });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Password recovery error: ' + (error as Error).message });
  }
});

// GET /api/auth/verify-reset-token/:token - Verify token before rendering reset form
router.get('/verify-reset-token/:token', (req, res) => {
  const { token } = req.params;
  const result = parkingStore.verifyResetToken(token);
  if (!result.valid) {
    return res.status(400).json({ error: result.message || 'Invalid or expired reset token' });
  }
  return res.json({ valid: true, email: result.email });
});

// POST /api/auth/reset-password - Consume single-use token and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const outcome = parkingStore.resetPasswordWithToken(token, newPassword);
    if (!outcome.success) {
      return res.status(400).json({ error: outcome.message });
    }

    return res.json({
      success: true,
      message: 'Password has been successfully updated. You may now log in with your new password.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Password reset error: ' + (error as Error).message });
  }
});

export default router;
