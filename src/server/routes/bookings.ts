import { Router } from 'express';
import crypto from 'crypto';
import { parkingStore } from '../store.ts';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { ioInstance } from '../socket.ts';

const router = Router();

// POST /api/bookings - Create new reservation
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      facilityId,
      slotId,
      vehicleType = 'car',
      vehicleNumber,
      startTime,
      endTime,
      durationHours,
      paymentMethod = 'demo',
      transactionId
    } = req.body;

    if (!facilityId || !slotId || !vehicleNumber || !startTime || !endTime || !durationHours) {
      return res.status(400).json({ error: 'Missing required reservation fields' });
    }

    const booking = await parkingStore.createBooking({
      userId: req.user!.id,
      facilityId,
      slotId,
      vehicleType,
      vehicleNumber,
      startTime,
      endTime,
      durationHours: Number(durationHours),
      paymentMethod,
      transactionId
    });

    // Broadcast real-time slot update to all connected clients
    const updatedSlot = parkingStore.slots.get(slotId);
    if (ioInstance && updatedSlot) {
      ioInstance.emit('slot_updated', {
        slot: updatedSlot,
        facilityId,
        bookingId: booking.id
      });
      ioInstance.emit('booking_created', {
        bookingId: booking.id,
        facilityId
      });
    }

    return res.status(201).json({ booking });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

// GET /api/bookings/my - Commuter bookings
router.get('/my', requireAuth, (req: AuthRequest, res) => {
  const myBookings = Array.from(parkingStore.bookings.values())
    .filter(b => b.userId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ bookings: myBookings });
});

// GET /api/bookings/facility/:facilityId - Owner facility bookings
router.get('/facility/:facilityId', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res) => {
  const { facilityId } = req.params;
  const facility = parkingStore.facilities.get(facilityId);
  if (!facility) return res.status(404).json({ error: 'Facility not found' });

  if (facility.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized facility access' });
  }

  const facilityBookings = Array.from(parkingStore.bookings.values())
    .filter(b => b.facilityId === facilityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ bookings: facilityBookings });
});

// GET /api/bookings/all - Admin all bookings review
router.get('/all', requireAuth, requireRole('admin'), (_req, res) => {
  const all = Array.from(parkingStore.bookings.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ bookings: all });
});

// POST /api/bookings/:id/cancel - Cancel booking
router.post('/:id/cancel', requireAuth, (req: AuthRequest, res) => {
  try {
    const booking = parkingStore.cancelBooking(req.params.id, req.user!.id);

    // Broadcast real-time slot update to all connected clients
    const updatedSlot = parkingStore.slots.get(booking.slotId);
    if (ioInstance && updatedSlot) {
      ioInstance.emit('slot_updated', {
        slot: updatedSlot,
        facilityId: booking.facilityId,
        bookingId: booking.id
      });
      ioInstance.emit('booking_status_changed', {
        bookingId: booking.id,
        status: 'cancelled'
      });
    }

    return res.json({ booking, message: 'Reservation successfully cancelled and payment refunded.' });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

// POST /api/bookings/verify-qr - Parking Owner ticket scanner / code verification
router.post('/verify-qr', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res) => {
  try {
    const { code, action = 'check-in' } = req.body;
    if (!code) return res.status(400).json({ error: 'Booking code or QR token is required' });

    // Find owner facilities
    const ownerFacilities = Array.from(parkingStore.facilities.values())
      .filter(f => req.user!.role === 'admin' || f.ownerId === req.user!.id)
      .map(f => f.id);

    let result;
    if (action === 'check-out') {
      result = parkingStore.checkOutWithCode(code, ownerFacilities);
    } else {
      result = parkingStore.checkInWithCode(code, ownerFacilities);
    }

    // Broadcast slot update
    const updatedSlot = parkingStore.slots.get(result.booking.slotId);
    if (ioInstance && updatedSlot) {
      ioInstance.emit('slot_updated', {
        slot: updatedSlot,
        facilityId: result.booking.facilityId,
        bookingId: result.booking.id
      });
      ioInstance.emit('booking_status_changed', {
        bookingId: result.booking.id,
        status: result.booking.status
      });
    }

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

// POST /api/bookings/razorpay/create-order
router.post('/razorpay/create-order', requireAuth, (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const isMock = !razorpayKeyId || razorpayKeyId.includes('yourKeyHere');

  const orderId = `order_rzp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  return res.json({
    orderId,
    amount: amount * 100, // in paise
    currency,
    receipt: receipt || `rec_${Date.now()}`,
    keyId: isMock ? 'rzp_test_demo_mode' : razorpayKeyId,
    isDemoSandbox: isMock
  });
});

// POST /api/bookings/razorpay/verify
router.post('/razorpay/verify', requireAuth, (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret || secret.includes('yourSecretHere')) {
    // In Demo Sandbox Mode
    return res.json({
      verified: true,
      transactionId: razorpay_payment_id || `pay_demo_${Date.now()}`,
      mode: 'Demo Sandbox'
    });
  }

  // Real HMAC SHA256 verification
  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    return res.json({ verified: true, transactionId: razorpay_payment_id, mode: 'Live Razorpay Test' });
  } else {
    return res.status(400).json({ verified: false, error: 'Payment signature verification failed' });
  }
});

export default router;
