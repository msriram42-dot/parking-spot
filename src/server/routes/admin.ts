import { Router } from 'express';
import { parkingStore } from '../store.ts';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Protect all admin endpoints
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/users - User management list
router.get('/users', (req: AuthRequest, res) => {
  try {
    const users = parkingStore.getAllUsers();
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/admin/users/:userId/role - Change user role or status
router.patch('/users/:userId', (req: AuthRequest, res) => {
  try {
    const { role, isActive } = req.body;
    const user = parkingStore.updateUserRole(req.params.userId, role, isActive);
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/admin/locations - Managed operational cities and zones
router.get('/locations', (req: AuthRequest, res) => {
  try {
    const locations = parkingStore.getLocations();
    return res.json({ locations });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/admin/locations/:city - Toggle city status or add area
router.patch('/locations/:city', (req: AuthRequest, res) => {
  try {
    const updated = parkingStore.updateLocation(req.params.city, req.body);
    return res.json({ location: updated });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/admin/listings - Comprehensive facility and listing management
router.get('/listings', (req: AuthRequest, res) => {
  try {
    const facilities = Array.from(parkingStore.facilities.values());
    return res.json({ facilities });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/admin/listings/:facilityId - Toggle verification or status
router.patch('/listings/:facilityId', (req: AuthRequest, res) => {
  try {
    const facility = parkingStore.facilities.get(req.params.facilityId);
    if (!facility) return res.status(404).json({ error: 'Facility not found' });

    const { isVerified, rates, name } = req.body;
    if (isVerified !== undefined) facility.isVerified = isVerified;
    if (rates) facility.rates = { ...facility.rates, ...rates };
    if (name) facility.name = name;

    return res.json({ facility });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/admin/bookings - Full global audit ledger
router.get('/bookings', (req: AuthRequest, res) => {
  try {
    const bookings = Array.from(parkingStore.bookings.values()).reverse();
    return res.json({ bookings });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/admin/bookings/:bookingId/cancel - Admin refund & cancellation
router.post('/bookings/:bookingId/cancel', (req: AuthRequest, res) => {
  try {
    const cancelled = parkingStore.cancelBooking(req.params.bookingId, req.user!.id);
    return res.json({ booking: cancelled, message: 'Reservation cancelled and refunded by Administrator' });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
