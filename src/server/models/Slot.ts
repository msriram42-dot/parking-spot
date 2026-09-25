import mongoose, { Schema, Document } from 'mongoose';

export interface ISlotDocument extends Document {
  facilityId: string;
  slotNumber: string;
  floor: string;
  type: 'car' | 'bike' | 'suv' | 'ev' | 'accessible';
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  pricePerHour: number;
  hasEVCharger: boolean;
  evDetails?: {
    connectorType: string;
    chargingPowerKw: number;
    pricePerKwh: number;
    connectorStatus: string;
  };
  bikeDetails?: {
    hasHelmetLocker: boolean;
    isCovered: boolean;
    bayWidthMeters: number;
  };
  distanceToExitMeters: number;
  currentBookingId?: string;
  reservedUntil?: Date;
}

const SlotSchema = new Schema<ISlotDocument>({
  facilityId: { type: String, required: true, index: true },
  slotNumber: { type: String, required: true },
  floor: { type: String, default: 'Ground' },
  type: { type: String, enum: ['car', 'bike', 'suv', 'ev', 'accessible'], default: 'car', index: true },
  status: { type: String, enum: ['available', 'reserved', 'occupied', 'maintenance'], default: 'available', index: true },
  pricePerHour: { type: Number, required: true },
  hasEVCharger: { type: Boolean, default: false, index: true },
  evDetails: {
    connectorType: { type: String },
    chargingPowerKw: { type: Number },
    pricePerKwh: { type: Number, default: 18 },
    connectorStatus: { type: String, default: 'available' }
  },
  bikeDetails: {
    hasHelmetLocker: { type: Boolean, default: true },
    isCovered: { type: Boolean, default: true },
    bayWidthMeters: { type: Number, default: 1.2 }
  },
  distanceToExitMeters: { type: Number, default: 25 },
  currentBookingId: { type: String },
  reservedUntil: { type: Date }
});

// Compound indexes for fast querying and concurrency locking
SlotSchema.index({ facilityId: 1, slotNumber: 1 }, { unique: true });
SlotSchema.index({ facilityId: 1, type: 1, status: 1 });

export const SlotModel = mongoose.models.Slot || mongoose.model<ISlotDocument>('Slot', SlotSchema);
