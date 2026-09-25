import mongoose, { Schema, Document } from 'mongoose';

export interface IFacilityDocument extends Document {
  name: string;
  ownerId: string;
  ownerName?: string;
  address: string;
  city: string;
  area: string;
  landmark: string;
  location: {
    lat: number;
    lng: number;
  };
  rates: {
    car: number;
    bike: number;
    suv: number;
    evMultiplier: number;
    evPerKwh?: number;
  };
  amenities: string[];
  totalSlots: number;
  availableSlots: number;
  floors: string[];
  rating: number;
  totalReviews: number;
  imageUrl: string;
  isVerified: boolean;
  evChargingAvailable: boolean;
  contactNumber: string;
  operatingHours: string;
  createdAt: Date;
}

const FacilitySchema = new Schema<IFacilityDocument>({
  name: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  ownerName: { type: String, default: 'Facility Owner' },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  area: { type: String, required: true, index: true },
  landmark: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  rates: {
    car: { type: Number, default: 40 },
    bike: { type: Number, default: 20 },
    suv: { type: Number, default: 60 },
    evMultiplier: { type: Number, default: 1.35 },
    evPerKwh: { type: Number, default: 18 }
  },
  amenities: [{ type: String }],
  totalSlots: { type: Number, default: 24 },
  availableSlots: { type: Number, default: 18 },
  floors: [{ type: String }],
  rating: { type: Number, default: 4.8 },
  totalReviews: { type: Number, default: 42 },
  imageUrl: { type: String },
  isVerified: { type: Boolean, default: true, index: true },
  evChargingAvailable: { type: Boolean, default: true, index: true },
  contactNumber: { type: String, default: '+91 98765 43210' },
  operatingHours: { type: String, default: '24/7' },
  createdAt: { type: Date, default: Date.now }
});

// Text index for robust search across name, city, area, and landmark
FacilitySchema.index({ name: 'text', city: 'text', area: 'text', landmark: 'text', address: 'text' });
FacilitySchema.index({ city: 1, area: 1 });

export const FacilityModel = mongoose.models.Facility || mongoose.model<IFacilityDocument>('Facility', FacilitySchema);
