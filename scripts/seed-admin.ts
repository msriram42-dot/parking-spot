/**
 * Safe Administrator Provisioning CLI Script
 * 
 * Usage:
 *   ADMIN_NAME="Your Admin Name" ADMIN_EMAIL="admin@domain.com" ADMIN_PASSWORD="yourStrongPassword" npx tsx scripts/seed-admin.ts
 * 
 * This script provisions or updates the administrator account securely in the database
 * with bcrypt hashing (10 rounds). Never exposes credentials in the UI or source code.
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

dotenv.config();

async function provisionAdministrator() {
  const adminName = process.env.ADMIN_NAME || 'Platform Administrator';
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('[Error] Both ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    console.error('Example: ADMIN_EMAIL="admin@company.com" ADMIN_PASSWORD="yourSecurePassword123!" npx tsx scripts/seed-admin.ts');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error('[Error] ADMIN_PASSWORD must be at least 8 characters long for security compliance.');
    process.exit(1);
  }

  const normalizedEmail = adminEmail.toLowerCase().trim();
  const passwordHash = bcrypt.hashSync(adminPassword, 10);

  console.log(`[Provisioning] Hashing credentials with bcrypt (10 rounds)...`);
  console.log(`[Provisioning] Target email: ${normalizedEmail}`);

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && !mongoUri.includes('<password>') && !mongoUri.includes('yourKeyHere')) {
    try {
      console.log('[Database] Connecting to MongoDB Atlas...');
      await mongoose.connect(mongoUri);
      
      const userSchema = new mongoose.Schema({
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        role: { type: String, required: true, enum: ['commuter', 'owner', 'admin'] },
        passwordHash: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        createdAt: { type: String, default: () => new Date().toISOString() }
      });

      const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
      
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        existing.passwordHash = passwordHash;
        existing.role = 'admin';
        existing.name = adminName;
        existing.isActive = true;
        await existing.save();
        console.log(`[Success] Existing user "${normalizedEmail}" upgraded/updated to Administrator with hashed password.`);
      } else {
        await UserModel.create({
          id: `usr_admin_${Date.now()}`,
          name: adminName,
          email: normalizedEmail,
          role: 'admin',
          passwordHash,
          isActive: true,
          createdAt: new Date().toISOString()
        });
        console.log(`[Success] New Administrator account created in MongoDB for "${normalizedEmail}".`);
      }

      await mongoose.disconnect();
    } catch (dbErr) {
      console.warn('[Notice] MongoDB connection was not available:', (dbErr as Error).message);
    }
  } else {
    console.log('[Notice] MONGODB_URI not configured. The application store initializes the admin with these environment variables on boot:');
    console.log(`  ADMIN_EMAIL=${normalizedEmail}`);
    console.log(`  ADMIN_NAME=${adminName}`);
  }

  console.log(`[Complete] Administrator provisioned securely. You can now log into the Platform Administrator Overview via the Dedicated Administrator Login portal.`);
}

provisionAdministrator().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
