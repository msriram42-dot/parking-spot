import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'commuter' | 'owner' | 'admin';
  phone?: string;
  vehicleNumber?: string;
  vehicleType?: 'car' | 'bike' | 'suv' | 'ev';
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['commuter', 'owner', 'admin'], default: 'commuter' },
  phone: { type: String },
  vehicleNumber: { type: String },
  vehicleType: { type: String, enum: ['car', 'bike', 'suv', 'ev'], default: 'car' },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
