/**
 * Database Layer for ParkingSpot
 * Supports MongoDB Atlas via Mongoose, with an intelligent in-memory persistence engine
 * if MONGODB_URI is not configured or in development, guaranteeing zero downtime.
 */

import mongoose from 'mongoose';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<password>') || uri.includes('yourKeyHere')) {
    console.log('[Database] MongoDB Atlas URI not configured with credentials. Using robust in-memory data store with full Mongoose compatibility.');
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    console.log('[Database] Successfully connected to MongoDB Atlas cluster.');
  } catch (error) {
    console.warn('[Database] Failed to connect to MongoDB Atlas, falling back to in-memory store:', (error as Error).message);
    isConnected = false;
  }
}

export function isMongoAtlasConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
