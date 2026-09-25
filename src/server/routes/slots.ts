import { Router } from 'express';
import { parkingStore } from '../store.ts';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/slots/facility/:facilityId or /api/slots/:facilityId/slots
router.get(['/:facilityId/slots', '/facility/:facilityId'], (req, res) => {
  const { facilityId } = req.params;
  const slots = Array.from(parkingStore.slots.values()).filter(s => s.facilityId === facilityId);
  return res.json({ slots });
});

// POST lock
router.post(['/:slotId/lock', '/slots/:slotId/lock'], requireAuth, (req: AuthRequest, res) => {
  const { slotId } = req.params;
  const userId = req.user!.id;

  const result = parkingStore.acquireSlotLock(slotId, userId, 300);
  if (!result.success) {
    return res.status(409).json({ error: result.message });
  }

  return res.json({ success: true, message: 'Slot lock acquired for 5 minutes' });
});

// DELETE lock
router.delete(['/:slotId/lock', '/slots/:slotId/lock'], requireAuth, (req: AuthRequest, res) => {
  const { slotId } = req.params;
  parkingStore.releaseSlotLock(slotId, req.user!.id);
  return res.json({ success: true });
});

// PATCH slot
router.patch(['/:slotId', '/slots/:slotId'], requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res) => {
  const { slotId } = req.params;
  const slot = parkingStore.slots.get(slotId);
  if (!slot) return res.status(404).json({ error: 'Slot not found' });

  const facility = parkingStore.facilities.get(slot.facilityId);
  if (facility && facility.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to manage this slot' });
  }

  const { status, hasEVCharger, pricePerHour, type } = req.body;
  if (status) slot.status = status;
  if (hasEVCharger !== undefined) slot.hasEVCharger = Boolean(hasEVCharger);
  if (pricePerHour !== undefined) slot.pricePerHour = Number(pricePerHour);
  if (type) slot.type = type;

  parkingStore.recomputeFacilitySlots(slot.facilityId);

  return res.json({ slot });
});

export default router;
