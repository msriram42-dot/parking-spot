import { Router } from 'express';
import { parkingStore } from '../store.ts';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import type { ParkingFacility } from '../../types/index.ts';

const router = Router();

// GET /api/facilities/autocomplete?q=...
router.get('/autocomplete', (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q || q.length < 1) {
      return res.json({ suggestions: [] });
    }

    const suggestions: Array<{
      type: 'area' | 'facility' | 'city' | 'service';
      title: string;
      subtitle: string;
      city?: string;
      area?: string;
      facilityId?: string;
      serviceType?: 'car' | 'ev' | 'bike';
    }> = [];

    const facilities = Array.from(parkingStore.facilities.values());

    // 1. Match Cities
    const uniqueCities = Array.from(new Set(facilities.map(f => f.city)));
    for (const city of uniqueCities) {
      if (city.toLowerCase().includes(q)) {
        suggestions.push({
          type: 'city',
          title: city,
          subtitle: `Explore all parking & EV hubs in ${city}`,
          city
        });
      }
    }

    // 2. Match Areas
    const uniqueAreas = Array.from(new Set(facilities.map(f => `${f.area}|${f.city}`)));
    for (const entry of uniqueAreas) {
      const [area, city] = entry.split('|');
      if (area.toLowerCase().includes(q)) {
        suggestions.push({
          type: 'area',
          title: area,
          subtitle: `${city} • Smart Parking & EV Hubs`,
          city,
          area
        });
      }
    }

    // 3. Match Service Queries
    if ('ev charging fast charger ccs2 electric'.includes(q)) {
      suggestions.push({
        type: 'service',
        title: 'EV Fast Charging Stations',
        subtitle: 'CCS2 60kW, Type 2 & DC Fast Charge stations',
        serviceType: 'ev'
      });
    }
    if ('bike two wheeler scooter motorcycle'.includes(q)) {
      suggestions.push({
        type: 'service',
        title: 'Two-Wheeler / Bike Parking',
        subtitle: 'Dedicated bays with helmet storage & CCTV',
        serviceType: 'bike'
      });
    }
    if ('car parking sedan suv multi level mlcp'.includes(q)) {
      suggestions.push({
        type: 'service',
        title: 'Car & SUV Parking Bays',
        subtitle: 'Multi-level covered bays with automated entry',
        serviceType: 'car'
      });
    }

    // 4. Match Facilities
    for (const f of facilities) {
      if (
        f.name.toLowerCase().includes(q) ||
        f.landmark.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q)
      ) {
        suggestions.push({
          type: 'facility',
          title: f.name,
          subtitle: `${f.area}, ${f.city} • ₹${f.rates.car}/hr`,
          city: f.city,
          area: f.area,
          facilityId: f.id
        });
      }
    }

    return res.json({ suggestions: suggestions.slice(0, 8) });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/facilities
router.get('/', (req, res) => {
  try {
    const { city, area, search, serviceType, evOnly, maxPrice, minRating } = req.query;
    let list = Array.from(parkingStore.facilities.values());

    // Filter by city
    if (city && city !== 'All') {
      list = list.filter(f => f.city.toLowerCase() === String(city).toLowerCase());
    }

    // Filter by area
    if (area && area !== 'All') {
      list = list.filter(f => f.area.toLowerCase() === String(area).toLowerCase());
    }

    // Filter by search text (checks name, address, landmark, area, city)
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.landmark.toLowerCase().includes(q) ||
        f.area.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q) ||
        f.amenities.some(a => a.toLowerCase().includes(q))
      );
    }

    // Filter by service section
    if (serviceType === 'ev' || evOnly === 'true') {
      list = list.filter(f => f.evChargingAvailable && (f.evSlotsCount ?? 1) > 0);
    } else if (serviceType === 'bike') {
      list = list.filter(f => (f.bikeSlotsCount ?? 1) > 0);
    } else if (serviceType === 'car') {
      list = list.filter(f => (f.carSlotsCount ?? 1) > 0);
    }

    // Filter by max hourly rate
    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        list = list.filter(f => {
          if (serviceType === 'bike') return f.rates.bike <= max;
          return f.rates.car <= max;
        });
      }
    }

    // Filter by min rating
    if (minRating) {
      const min = parseFloat(String(minRating));
      if (!isNaN(min)) {
        list = list.filter(f => f.rating >= min);
      }
    }

    return res.json({ facilities: list });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/facilities/:id
router.get('/:id', (req, res) => {
  const facility = parkingStore.facilities.get(req.params.id);
  if (!facility) return res.status(404).json({ error: 'Parking facility not found' });
  return res.json({ facility });
});

// GET /api/facilities/:facilityId/slots
router.get('/:facilityId/slots', (req, res) => {
  const { facilityId } = req.params;
  const { type } = req.query;
  let slots = Array.from(parkingStore.slots.values()).filter(s => s.facilityId === facilityId);
  if (type && type !== 'all') {
    if (type === 'car') slots = slots.filter(s => s.type === 'car' || s.type === 'suv' || s.type === 'accessible');
    else if (type === 'bike') slots = slots.filter(s => s.type === 'bike');
    else if (type === 'ev') slots = slots.filter(s => s.hasEVCharger || s.type === 'ev');
  }
  return res.json({ slots });
});

// POST /api/facilities (owner/admin)
router.post('/', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res) => {
  try {
    const { name, address, city, area, landmark, location, rates, amenities, totalSlots = 24, floors = ['Ground', 'B1'], imageUrl } = req.body;
    if (!name || !address || !city) {
      return res.status(400).json({ error: 'Name, address, and city are required' });
    }

    const id = `fac_${city.toLowerCase().substring(0, 3)}_${Date.now()}`;
    const newFacility: ParkingFacility = {
      id,
      name,
      ownerId: req.user!.id,
      ownerName: req.user!.name,
      address,
      city,
      area: area || landmark || city,
      landmark: landmark || 'Centrally located',
      location: location || { lat: 13.0827, lng: 80.2707 },
      rates: rates || { car: 40, bike: 15, suv: 60, evMultiplier: 1.35, evPerKwh: 18 },
      amenities: amenities || ['CCTV Surveillance', '24/7 Security', 'Mobile App Booking'],
      totalSlots: Number(totalSlots) || 24,
      availableSlots: Number(totalSlots) || 24,
      floors: floors.length ? floors : ['Ground'],
      rating: 5.0,
      totalReviews: 1,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
      isVerified: true,
      evChargingAvailable: amenities?.some((a: string) => a.toLowerCase().includes('ev')) || true,
      contactNumber: '+91 98000 12345',
      operatingHours: '24/7 Open',
      createdAt: new Date().toISOString()
    };

    parkingStore.facilities.set(newFacility.id, newFacility);
    parkingStore.recomputeFacilitySlots(newFacility.id);

    return res.status(201).json({ facility: newFacility });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/facilities/:id
router.put('/:id', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res) => {
  const facility = parkingStore.facilities.get(req.params.id);
  if (!facility) return res.status(404).json({ error: 'Facility not found' });

  if (facility.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to modify this facility' });
  }

  const { name, address, area, landmark, rates, amenities, operatingHours, contactNumber, isVerified } = req.body;
  if (name) facility.name = name;
  if (address) facility.address = address;
  if (area) facility.area = area;
  if (landmark) facility.landmark = landmark;
  if (rates) facility.rates = { ...facility.rates, ...rates };
  if (amenities) facility.amenities = amenities;
  if (operatingHours) facility.operatingHours = operatingHours;
  if (contactNumber) facility.contactNumber = contactNumber;
  if (isVerified !== undefined && req.user!.role === 'admin') facility.isVerified = isVerified;

  return res.json({ facility });
});

export default router;
