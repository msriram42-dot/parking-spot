export type UserRole = 'commuter' | 'owner' | 'admin';

export type VehicleType = 'car' | 'bike' | 'suv' | 'ev';

export type SlotStatus = 'available' | 'reserved' | 'occupied' | 'maintenance';

export type SlotType = 'car' | 'bike' | 'suv' | 'ev' | 'accessible';

export type BookingStatus = 'confirmed' | 'active' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type ServiceSection = 'all' | 'car' | 'ev' | 'bike';

export interface EVDetails {
  connectorType: 'CCS2 (60kW DC)' | 'Type 2 (22kW AC)' | 'CHAdeMO (50kW DC)' | 'Bharat AC001 (3.3kW)' | string;
  chargingPowerKw: number; // e.g. 60, 30, 22
  pricePerKwh: number; // in INR
  connectorStatus: 'available' | 'charging' | 'reserved';
  voltage?: number;
}

export interface BikeDetails {
  hasHelmetLocker: boolean;
  isCovered: boolean;
  bayWidthMeters: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  isActive?: boolean;
  totalBookings?: number;
  createdAt: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface FacilityRates {
  car: number; // in INR / hour
  bike: number;
  suv: number;
  evMultiplier: number; // e.g. 1.35x
  evPerKwh?: number; // e.g. 18 INR / kWh
}

export interface ParkingFacility {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  address: string;
  city: string; // 'Chennai' | 'Bangalore' | 'Mumbai' | 'Delhi' | 'Hyderabad'
  area: string; // e.g. 'Anna Nagar', 'T. Nagar', 'Velachery', 'Tambaram', 'OMR', 'Indiranagar'
  landmark: string;
  location: Coordinates;
  rates: FacilityRates;
  amenities: string[];
  totalSlots: number;
  availableSlots: number;
  carSlotsCount?: number;
  bikeSlotsCount?: number;
  evSlotsCount?: number;
  floors: string[];
  rating: number;
  totalReviews: number;
  imageUrl: string;
  isVerified: boolean;
  evChargingAvailable: boolean;
  contactNumber: string;
  operatingHours: string;
  createdAt: string;
}

export interface ParkingSlot {
  id: string;
  facilityId: string;
  slotNumber: string; // e.g. "G-01", "B1-14"
  floor: string; // e.g. "Ground", "B1", "B2"
  type: SlotType;
  status: SlotStatus;
  pricePerHour: number;
  hasEVCharger: boolean;
  evDetails?: EVDetails;
  bikeDetails?: BikeDetails;
  distanceToExitMeters: number;
  currentBookingId?: string;
  reservedUntil?: string;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "PK-2026-9812"
  userId: string;
  userName: string;
  userEmail: string;
  facilityId: string;
  facilityName: string;
  facilityAddress: string;
  slotId: string;
  slotNumber: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: 'razorpay' | 'demo' | 'upi';
  transactionId?: string;
  status: BookingStatus;
  qrCodeDataUrl?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt: string;
}

export interface AIRecommendation {
  facilityId: string;
  facilityName: string;
  slotId: string;
  slotNumber: string;
  floor: string;
  distanceKm: number;
  pricePerHour: number;
  estimatedTotal: number;
  matchScore: number; // 0 - 100%
  hasEVCharger: boolean;
  reason: string;
}

export interface PlatformAnalytics {
  totalFacilities: number;
  totalSlots: number;
  carSpaces: number;
  bikeSpaces: number;
  evChargingStations: number;
  availableCarSpaces: number;
  availableBikeSpaces: number;
  availableEVStations: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  overallOccupancyRate: number;
  roleBreakdown: {
    commuters: number;
    owners: number;
    admins: number;
  };
  cityDistribution: {
    city: string;
    facilitiesCount: number;
    slotsCount: number;
    carCount: number;
    bikeCount: number;
    evCount: number;
  }[];
  peakHours: {
    hour: string;
    bookingsCount: number;
  }[];
  recentBookings: Booking[];
}

export interface ManagedLocation {
  city: string;
  state: string;
  areas: string[];
  isActive: boolean;
  totalHubs: number;
  carBays: number;
  bikeBays: number;
  evPorts: number;
}
