import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingDocument extends Document {
  bookingCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  facilityId: string;
  facilityName: string;
  facilityAddress: string;
  slotId: string;
  slotNumber: string;
  vehicleType: 'car' | 'bike' | 'suv' | 'ev';
  vehicleNumber: string;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'razorpay' | 'demo' | 'upi';
  transactionId?: string;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  qrCodeDataUrl?: string;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt: Date;
}

const BookingSchema = new Schema<IBookingDocument>({
  bookingCode: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  facilityId: { type: String, required: true, index: true },
  facilityName: { type: String, required: true },
  facilityAddress: { type: String, required: true },
  slotId: { type: String, required: true, index: true },
  slotNumber: { type: String, required: true },
  vehicleType: { type: String, enum: ['car', 'bike', 'suv', 'ev'], required: true },
  vehicleNumber: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationHours: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'paid' },
  paymentMethod: { type: String, enum: ['razorpay', 'demo', 'upi'], default: 'razorpay' },
  transactionId: { type: String },
  status: { type: String, enum: ['confirmed', 'active', 'completed', 'cancelled'], default: 'confirmed', index: true },
  qrCodeDataUrl: { type: String },
  checkedInAt: { type: Date },
  checkedOutAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export const BookingModel = mongoose.models.Booking || mongoose.model<IBookingDocument>('Booking', BookingSchema);
