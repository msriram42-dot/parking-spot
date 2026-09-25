/**
 * Safe Administrator Provisioning CLI Script
 * Run with: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
 * 
 * Never hardcodes or logs passwords. Hashes password using bcrypt.
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { UserModel } from './models/User.ts';
import { parkingStore } from './store.ts';

dotenv.config();

async function provisionAdministrator() {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const adminName = process.env.ADMIN_NAME || 'Platform Administrator';

  if (!adminEmail || !adminPassword) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    console.error('Usage: ADMIN_EMAIL="admin@yourdomain.com" ADMIN_PASSWORD="your-strong-password" npm run seed:admin');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error('ERROR: Administrator password must be at least 8 characters long for security compliance.');
    process.exit(1);
  }

  console.log(`[Admin Provisioning] Preparing secure administrative account for: ${adminEmail}`);

  const passwordHash = bcrypt.hashSync(adminPassword, 12);

  // Update in memory store
  const existingStoreAdmin = Array.from(parkingStore.users.values()).find(u => u.email === adminEmail);
  if (existingStoreAdmin) {
    existingStoreAdmin.passwordHash = passwordHash;
    existingStoreAdmin.role = 'admin';
    existingStoreAdmin.name = adminName;
    console.log('[Admin Provisioning] In-memory store administrator updated successfully.');
  } else {
    const newId = `usr_admin_${Date.now()}`;
    parkingStore.users.set(newId, {
      id: newId,
      name: adminName,
      email: adminEmail,
      role: 'admin',
      isActive: true,
      totalBookings: 0,
      passwordHash,
      createdAt: new Date().toISOString()
    });
    console.log('[Admin Provisioning] In-memory store administrator created successfully.');
  }

  // Also sync to MongoDB Atlas if connection URI is provided
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && !mongoUri.includes('<password>') && !mongoUri.includes('yourKeyHere')) {
    try {
      await mongoose.connect(mongoUri);
      await UserModel.findOneAndUpdate(
        { email: adminEmail },
        {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: 'admin',
          createdAt: new Date()
        },
        { upsert: true, new: true }
      );
      console.log('[Admin Provisioning] MongoDB Atlas administrator document synchronized securely.');
      await mongoose.disconnect();
    } catch (err) {
      console.warn('[Admin Provisioning] Warning syncing with MongoDB Atlas:', (err as Error).message);
    }
  }

  console.log('[Admin Provisioning] SUCCESS: Administrator account provisioned securely. No plain-text credentials stored.');
}

provisionAdministrator().catch(err => {
  console.error('[Admin Provisioning Fatal Error]:', err);
  process.exit(1);
});
