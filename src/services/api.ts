import { ParkingFacility, ParkingSlot, Booking, PlatformAnalytics, User, VehicleType, AIRecommendation, ManagedLocation, ServiceSection } from '../types/index.ts';

// On Vercel set VITE_API_ORIGIN to your separately hosted Express backend,
// e.g. https://parkingspot-backend.onrender.com (no /api suffix).
const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/+$/, '');
const BASE_URL = `${API_ORIGIN}/api`;

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('parkingspot_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  adminLogin: async (email: string, password: string, adminKey?: string): Promise<{ token: string; user: User; message: string }> => {
    const res = await fetch(`${BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, adminKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Administrator login failed');
    return data;
  },

  logout: async (): Promise<{ success: boolean }> => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch (e) {
      // ignore network errors on logout
    }
    localStorage.removeItem('parkingspot_token');
    return { success: true };
  },

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    vehicleNumber?: string;
    vehicleType?: string;
  }): Promise<{ token: string; user: User }> => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  },

  forgotPassword: async (email: string): Promise<{
    success: boolean;
    message: string;
    emailDeliveryConfigured?: boolean;
    resetToken?: string;
    expiresAt?: string;
  }> => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password recovery request failed');
    return data;
  },

  verifyResetToken: async (token: string): Promise<{ valid: boolean; email?: string }> => {
    const res = await fetch(`${BASE_URL}/auth/verify-reset-token/${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Token verification failed');
    return data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    return data;
  },

  // Autocomplete search
  getAutocomplete: async (q: string): Promise<{
    suggestions: Array<{
      type: 'area' | 'facility' | 'city' | 'service';
      title: string;
      subtitle: string;
      city?: string;
      area?: string;
      facilityId?: string;
      serviceType?: 'car' | 'ev' | 'bike';
    }>;
  }> => {
    if (!q || q.trim().length === 0) return { suggestions: [] };
    const res = await fetch(`${BASE_URL}/facilities/autocomplete?q=${encodeURIComponent(q.trim())}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data;
  },

  // Facilities
  getFacilities: async (params?: {
    city?: string;
    area?: string;
    search?: string;
    serviceType?: ServiceSection;
    evOnly?: boolean;
    maxPrice?: number;
    minRating?: number;
  }): Promise<{ facilities: ParkingFacility[] }> => {
    const query = new URLSearchParams();
    if (params?.city) query.append('city', params.city);
    if (params?.area) query.append('area', params.area);
    if (params?.search) query.append('search', params.search);
    if (params?.serviceType && params.serviceType !== 'all') query.append('serviceType', params.serviceType);
    if (params?.evOnly) query.append('evOnly', 'true');
    if (params?.maxPrice) query.append('maxPrice', String(params.maxPrice));
    if (params?.minRating) query.append('minRating', String(params.minRating));

    const res = await fetch(`${BASE_URL}/facilities?${query.toString()}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch facilities');
    return data;
  },

  getFacility: async (id: string): Promise<{ facility: ParkingFacility }> => {
    const res = await fetch(`${BASE_URL}/facilities/${id}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Facility not found');
    return data;
  },

  createFacility: async (payload: Partial<ParkingFacility>): Promise<{ facility: ParkingFacility }> => {
    const res = await fetch(`${BASE_URL}/facilities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create facility');
    return data;
  },

  updateFacility: async (id: string, payload: Partial<ParkingFacility>): Promise<{ facility: ParkingFacility }> => {
    const res = await fetch(`${BASE_URL}/facilities/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update facility');
    return data;
  },

  // Slots
  getSlots: async (facilityId: string, type?: string): Promise<{ slots: ParkingSlot[] }> => {
    const url = type ? `${BASE_URL}/facilities/${facilityId}/slots?type=${type}` : `${BASE_URL}/facilities/${facilityId}/slots`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch slots');
    return data;
  },

  lockSlot: async (slotId: string): Promise<{ success: boolean; message?: string }> => {
    const res = await fetch(`${BASE_URL}/slots/slots/${slotId}/lock`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to lock slot');
    return data;
  },

  releaseSlotLock: async (slotId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE_URL}/slots/slots/${slotId}/lock`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    return data;
  },

  updateSlot: async (slotId: string, payload: Partial<ParkingSlot>): Promise<{ slot: ParkingSlot }> => {
    const res = await fetch(`${BASE_URL}/slots/slots/${slotId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update slot');
    return data;
  },

  // Bookings
  createBooking: async (payload: {
    facilityId: string;
    slotId: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    paymentMethod: 'razorpay' | 'demo' | 'upi';
    transactionId?: string;
  }): Promise<{ booking: Booking }> => {
    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reservation failed');
    return data;
  },

  getMyBookings: async (): Promise<{ bookings: Booking[] }> => {
    const res = await fetch(`${BASE_URL}/bookings/my`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');
    return data;
  },

  getFacilityBookings: async (facilityId: string): Promise<{ bookings: Booking[] }> => {
    const res = await fetch(`${BASE_URL}/bookings/facility/${facilityId}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');
    return data;
  },

  getAllBookings: async (): Promise<{ bookings: Booking[] }> => {
    const res = await fetch(`${BASE_URL}/bookings/all`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch all bookings');
    return data;
  },

  cancelBooking: async (bookingId: string): Promise<{ booking: Booking; message: string }> => {
    const res = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
    return data;
  },

  verifyQRCode: async (code: string, action: 'check-in' | 'check-out' = 'check-in'): Promise<{ booking: Booking; message: string }> => {
    const res = await fetch(`${BASE_URL}/bookings/verify-qr`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'QR Verification failed');
    return data;
  },

  // Payments
  createRazorpayOrder: async (amount: number, receipt?: string) => {
    const res = await fetch(`${BASE_URL}/bookings/razorpay/create-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, receipt }),
    });
    return res.json();
  },

  verifyRazorpayPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const res = await fetch(`${BASE_URL}/bookings/razorpay/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // AI ParkBot
  askParkBot: async (prompt: string, city?: string, userVehicleType?: string): Promise<{
    query: string;
    message: string;
    extracted: any;
    recommendations: AIRecommendation[];
  }> => {
    const res = await fetch(`${BASE_URL}/ai/parkbot`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, city, userVehicleType }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ParkBot failed to respond');
    return data;
  },

  // Analytics
  getPlatformAnalytics: async (): Promise<{ analytics: PlatformAnalytics }> => {
    const res = await fetch(`${BASE_URL}/analytics/platform`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch platform analytics');
    return data;
  },

  getFacilityAnalytics: async (facilityId: string): Promise<{ analytics: any }> => {
    const res = await fetch(`${BASE_URL}/analytics/facility/${facilityId}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch facility analytics');
    return data;
  },

  // Admin Management Endpoints
  getAdminUsers: async (): Promise<{ users: User[] }> => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin users');
    return data;
  },

  updateAdminUser: async (userId: string, payload: { role?: User['role']; isActive?: boolean }): Promise<{ user: User }> => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user');
    return data;
  },

  getAdminLocations: async (): Promise<{ locations: ManagedLocation[] }> => {
    const res = await fetch(`${BASE_URL}/admin/locations`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin locations');
    return data;
  },

  updateAdminLocation: async (city: string, payload: Partial<ManagedLocation>): Promise<{ location: ManagedLocation }> => {
    const res = await fetch(`${BASE_URL}/admin/locations/${city}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update location');
    return data;
  },

  getAdminListings: async (): Promise<{ facilities: ParkingFacility[] }> => {
    const res = await fetch(`${BASE_URL}/admin/listings`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin listings');
    return data;
  },

  updateAdminListing: async (facilityId: string, payload: Partial<ParkingFacility>): Promise<{ facility: ParkingFacility }> => {
    const res = await fetch(`${BASE_URL}/admin/listings/${facilityId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update listing');
    return data;
  },

  cancelAdminBooking: async (bookingId: string): Promise<{ booking: Booking; message: string }> => {
    const res = await fetch(`${BASE_URL}/admin/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
    return data;
  },
};
