import 'dotenv/config';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { User, ParkingFacility, ParkingSlot, Booking, PlatformAnalytics, VehicleType, ManagedLocation } from '../types/index.ts';

// In-memory atomic data store backed by realistic seed and Mongoose sync
class ParkingStore {
  public users: Map<string, User & { passwordHash: string }> = new Map();
  public facilities: Map<string, ParkingFacility> = new Map();
  public slots: Map<string, ParkingSlot> = new Map();
  public bookings: Map<string, Booking> = new Map();
  public locations: Map<string, ManagedLocation> = new Map();
  private slotLocks: Map<string, { userId: string; expiresAt: number }> = new Map();
  public resetTokens: Map<string, { email: string; expiresAt: number }> = new Map();
  public revokedTokens: Set<string> = new Set();

  constructor() {
    this.seedInitialData();
  }

  private async seedInitialData() {
    const passwordHash = bcrypt.hashSync(process.env.COMMUTER_SEED_PASSWORD || 'commuter123', 10);
    const ownerHash = bcrypt.hashSync(process.env.OWNER_SEED_PASSWORD || 'owner123', 10);
    const adminPass = process.env.ADMIN_PASSWORD || 'AdminSecure2026!#';
    const adminHash = bcrypt.hashSync(adminPass, 10);
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@parkingspot.ai').toLowerCase().trim();

    // Seed Core Users
    const commuterUser: User & { passwordHash: string } = {
      id: 'usr_commuter_1',
      name: 'Arjun Mehta',
      email: 'arjun@commuter.com',
      phone: '+91 98450 12345',
      role: 'commuter',
      vehicleNumber: 'KA-01-MJ-4590',
      vehicleType: 'car',
      isActive: true,
      totalBookings: 8,
      passwordHash,
      createdAt: '2026-01-10T10:00:00.000Z'
    };

    const commuterUser2: User & { passwordHash: string } = {
      id: 'usr_commuter_2',
      name: 'Kavitha Sundaram',
      email: 'kavitha@commuter.com',
      phone: '+91 94440 55667',
      role: 'commuter',
      vehicleNumber: 'TN-09-CB-1234',
      vehicleType: 'ev',
      isActive: true,
      totalBookings: 5,
      passwordHash,
      createdAt: '2026-01-14T11:20:00.000Z'
    };

    const commuterUser3: User & { passwordHash: string } = {
      id: 'usr_commuter_3',
      name: 'Manoj Kumar',
      email: 'manoj@commuter.com',
      phone: '+91 98840 99881',
      role: 'commuter',
      vehicleNumber: 'TN-07-AL-7890',
      vehicleType: 'bike',
      isActive: true,
      totalBookings: 12,
      passwordHash,
      createdAt: '2026-01-18T16:45:00.000Z'
    };

    const ownerUser: User & { passwordHash: string } = {
      id: 'usr_owner_1',
      name: 'Rajesh Sharma',
      email: 'rajesh@parkingowner.com',
      phone: '+91 98200 67890',
      role: 'owner',
      isActive: true,
      totalBookings: 0,
      passwordHash: ownerHash,
      createdAt: '2026-01-05T09:00:00.000Z'
    };

    const ownerUser2: User & { passwordHash: string } = {
      id: 'usr_owner_2',
      name: 'Suresh Ramanathan',
      email: 'suresh@chennaiparking.in',
      phone: '+91 98401 23456',
      role: 'owner',
      isActive: true,
      totalBookings: 0,
      passwordHash: ownerHash,
      createdAt: '2026-01-08T10:30:00.000Z'
    };

    const adminUser: User & { passwordHash: string } = {
      id: 'usr_admin_1',
      name: process.env.ADMIN_NAME || 'Platform Administrator',
      email: adminEmail,
      phone: '+91 98111 22334',
      role: 'admin',
      isActive: true,
      totalBookings: 0,
      passwordHash: adminHash,
      createdAt: '2026-01-01T08:00:00.000Z'
    };

    this.users.set(commuterUser.id, commuterUser);
    this.users.set(commuterUser2.id, commuterUser2);
    this.users.set(commuterUser3.id, commuterUser3);
    this.users.set(ownerUser.id, ownerUser);
    this.users.set(ownerUser2.id, ownerUser2);
    this.users.set(adminUser.id, adminUser);

    // Seed Operational Locations
    const locationsList: ManagedLocation[] = [
      {
        city: 'Chennai',
        state: 'Tamil Nadu',
        areas: ['Anna Nagar', 'T. Nagar', 'Velachery', 'Tambaram', 'OMR'],
        isActive: true,
        totalHubs: 5,
        carBays: 84,
        bikeBays: 38,
        evPorts: 24
      },
      {
        city: 'Bangalore',
        state: 'Karnataka',
        areas: ['Indiranagar', 'MG Road', 'Koramangala', 'Whitefield', 'HSR Layout'],
        isActive: true,
        totalHubs: 2,
        carBays: 32,
        bikeBays: 12,
        evPorts: 8
      },
      {
        city: 'Mumbai',
        state: 'Maharashtra',
        areas: ['BKC', 'Andheri East', 'Lower Parel', 'Colaba'],
        isActive: true,
        totalHubs: 1,
        carBays: 20,
        bikeBays: 6,
        evPorts: 6
      },
      {
        city: 'Delhi',
        state: 'Delhi NCR',
        areas: ['Connaught Place', 'Aerocity', 'Saket', 'Cyber City'],
        isActive: true,
        totalHubs: 1,
        carBays: 18,
        bikeBays: 6,
        evPorts: 4
      },
      {
        city: 'Hyderabad',
        state: 'Telangana',
        areas: ['Hitec City', 'Gachibowli', 'Madhapur', 'Banjara Hills'],
        isActive: true,
        totalHubs: 1,
        carBays: 16,
        bikeBays: 6,
        evPorts: 4
      }
    ];

    locationsList.forEach(loc => this.locations.set(loc.city.toLowerCase(), loc));

    // Seed Facilities (including all 5 Chennai hubs requested + Bangalore, Mumbai, Delhi, Hyderabad)
    const facilitiesList: ParkingFacility[] = [
      // CHENNAI 1: ANNA NAGAR
      {
        id: 'fac_chn_anna',
        name: 'Anna Nagar Roundtana Smart Parking & EV Hub',
        ownerId: 'usr_owner_2',
        ownerName: 'Suresh Ramanathan',
        address: '2nd Avenue, Near Roundtana, Anna Nagar',
        city: 'Chennai',
        area: 'Anna Nagar',
        landmark: 'Near Anna Nagar Tower Park & Roundtana Metro Station Gate 2',
        location: { lat: 13.0850, lng: 80.2101 },
        rates: { car: 40, bike: 15, suv: 60, evMultiplier: 1.35, evPerKwh: 17 },
        amenities: ['CCS2 Fast Chargers', 'Covered Roof', 'Dedicated Two-Wheeler Bays', 'Helmet Lockers', 'CCTV 24/7', 'Valet Service'],
        totalSlots: 28,
        availableSlots: 18,
        floors: ['Ground', 'B1', 'B2'],
        rating: 4.9,
        totalReviews: 112,
        imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 44 2621 4455',
        operatingHours: '24/7 Open',
        createdAt: '2026-01-10T10:00:00.000Z'
      },
      // CHENNAI 2: T. NAGAR
      {
        id: 'fac_chn_tnagar',
        name: 'T. Nagar Smart MLCP & Two-Wheeler Plaza',
        ownerId: 'usr_owner_2',
        ownerName: 'Suresh Ramanathan',
        address: 'Thanikachalam Road, Thyagaraya Nagar',
        city: 'Chennai',
        area: 'T. Nagar',
        landmark: 'Near Pondy Bazaar, Usman Road & Panagal Park',
        location: { lat: 13.0418, lng: 80.2341 },
        rates: { car: 50, bike: 20, suv: 75, evMultiplier: 1.3, evPerKwh: 18 },
        amenities: ['Multi-Level Car Parking (MLCP)', '14 Dedicated Bike Bays', 'Helmet Storage Facility', 'Type 2 AC Charging', 'Smart Boom Barrier'],
        totalSlots: 32,
        availableSlots: 20,
        floors: ['Ground', 'B1', 'B2'],
        rating: 4.8,
        totalReviews: 145,
        imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 44 2815 8890',
        operatingHours: '6:00 AM - 11:30 PM',
        createdAt: '2026-01-12T11:00:00.000Z'
      },
      // CHENNAI 3: VELACHERY
      {
        id: 'fac_chn_velachery',
        name: 'Velachery MRTS & Phoenix EV Super Plaza',
        ownerId: 'usr_owner_2',
        ownerName: 'Suresh Ramanathan',
        address: 'Velachery Bypass Road, Velachery',
        city: 'Chennai',
        area: 'Velachery',
        landmark: 'Opposite Phoenix MarketCity & Velachery MRTS Station',
        location: { lat: 12.9808, lng: 80.2185 },
        rates: { car: 45, bike: 15, suv: 70, evMultiplier: 1.4, evPerKwh: 19 },
        amenities: ['Ultra 60kW DC Dual Guns', 'CHAdeMO Compatible', 'Covered Parking Deck', 'Wheelchair Access', '24/7 Security'],
        totalSlots: 26,
        availableSlots: 15,
        floors: ['Ground', 'B1'],
        rating: 4.9,
        totalReviews: 98,
        imageUrl: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 44 2244 5566',
        operatingHours: '24/7 Open',
        createdAt: '2026-01-14T09:30:00.000Z'
      },
      // CHENNAI 4: TAMBARAM
      {
        id: 'fac_chn_tambaram',
        name: 'Tambaram Transit Interchange Parking',
        ownerId: 'usr_owner_2',
        ownerName: 'Suresh Ramanathan',
        address: 'GST Road, Tambaram West',
        city: 'Chennai',
        area: 'Tambaram',
        landmark: 'Direct Subway Walkway to Tambaram Railway Station & MEZ Bus Stand',
        location: { lat: 12.9249, lng: 80.1280 },
        rates: { car: 35, bike: 15, suv: 50, evMultiplier: 1.25, evPerKwh: 16 },
        amenities: ['Railway Commuter Transit Access', 'High Capacity Bike Parking', 'Type 2 EV Chargers', 'Automated Token & QR Gates'],
        totalSlots: 30,
        availableSlots: 19,
        floors: ['Ground', 'B1', 'B2'],
        rating: 4.6,
        totalReviews: 87,
        imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 44 2226 7788',
        operatingHours: '24/7 Open',
        createdAt: '2026-01-16T08:00:00.000Z'
      },
      // CHENNAI 5: OMR (Old Mahabalipuram Road)
      {
        id: 'fac_chn_omr',
        name: 'OMR IT Corridor Tech Park EV Hub',
        ownerId: 'usr_owner_2',
        ownerName: 'Suresh Ramanathan',
        address: 'Rajiv Gandhi Salai (OMR), Sholinganallur',
        city: 'Chennai',
        area: 'OMR',
        landmark: 'Near Sholinganallur Junction, ELCOT SEZ & TCS Techno Park',
        location: { lat: 12.9010, lng: 80.2279 },
        rates: { car: 45, bike: 20, suv: 65, evMultiplier: 1.35, evPerKwh: 18 },
        amenities: ['120kW Supercharger Station', 'Techie Daily Passes', 'Covered Roof Shade', 'Air-Conditioned Waiting Lounge', 'Cafe & Restroom'],
        totalSlots: 30,
        availableSlots: 18,
        floors: ['Ground', 'B1', 'B2'],
        rating: 4.9,
        totalReviews: 130,
        imageUrl: 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 44 2450 1122',
        operatingHours: '24/7 Open',
        createdAt: '2026-01-18T10:00:00.000Z'
      },

      // BANGALORE 1
      {
        id: 'fac_blr_1',
        name: 'Indiranagar Metro Smart Hub',
        ownerId: 'usr_owner_1',
        ownerName: 'Rajesh Sharma',
        address: '100 Feet Rd, HAL 2nd Stage, Indiranagar',
        city: 'Bangalore',
        area: 'Indiranagar',
        landmark: 'Near Chinmaya Mission Hospital & Indiranagar Metro',
        location: { lat: 12.9784, lng: 77.6408 },
        rates: { car: 50, bike: 20, suv: 70, evMultiplier: 1.3, evPerKwh: 18 },
        amenities: ['CCS2 Fast Charger (60kW)', 'CCTV 24/7', 'Covered Roof', 'Valet Assistance', 'Automated Barrier', 'Elevator Access'],
        totalSlots: 24,
        availableSlots: 15,
        floors: ['Ground', 'B1', 'B2'],
        rating: 4.8,
        totalReviews: 84,
        imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 80 4122 8899',
        operatingHours: '24/7 Open',
        createdAt: '2026-01-12T12:00:00.000Z'
      },
      // BANGALORE 2
      {
        id: 'fac_blr_2',
        name: 'MG Road Cyber Tower Parking',
        ownerId: 'usr_owner_1',
        ownerName: 'Rajesh Sharma',
        address: 'MG Road, Ashok Nagar',
        city: 'Bangalore',
        area: 'MG Road',
        landmark: 'Near Trinity Metro Station & Brigade Road',
        location: { lat: 12.9756, lng: 77.6067 },
        rates: { car: 60, bike: 25, suv: 80, evMultiplier: 1.25, evPerKwh: 19 },
        amenities: ['Multi-level Automated', 'EV Charging', 'Security Guard', 'Wheelchair Accessible', 'Car Wash Bay'],
        totalSlots: 20,
        availableSlots: 11,
        floors: ['Ground', 'B1'],
        rating: 4.6,
        totalReviews: 62,
        imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 80 2558 3311',
        operatingHours: '6:00 AM - 11:30 PM',
        createdAt: '2026-01-15T08:00:00.000Z'
      },
      // MUMBAI
      {
        id: 'fac_mum_1',
        name: 'BKC Horizon Business Multi-Deck',
        ownerId: 'usr_owner_1',
        ownerName: 'Rajesh Sharma',
        address: 'G Block, Bandra Kurla Complex',
        city: 'Mumbai',
        area: 'BKC',
        landmark: 'Adjacent to Asian Heart Institute & Jio World Garden',
        location: { lat: 19.0657, lng: 72.8687 },
        rates: { car: 80, bike: 30, suv: 110, evMultiplier: 1.4, evPerKwh: 20 },
        amenities: ['Ultra EV 60kW DC Fast Charger', 'Valet Service', 'Underground Air-Cooled', 'License Plate Reader', 'Mobile App QR Gates'],
        totalSlots: 28,
        availableSlots: 16,
        floors: ['Ground', 'B1', 'B2', 'B3'],
        rating: 4.9,
        totalReviews: 128,
        imageUrl: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 22 6670 4455',
        operatingHours: '24/7 Open',
        createdAt: '2026-01-18T14:30:00.000Z'
      },
      // DELHI
      {
        id: 'fac_del_1',
        name: 'Connaught Place Central Park Plaza',
        ownerId: 'usr_owner_1',
        ownerName: 'Rajesh Sharma',
        address: 'Block B, Inner Circle, Connaught Place',
        city: 'Delhi',
        area: 'Connaught Place',
        landmark: 'Near Rajiv Chowk Metro Gate 3 & Palika Bazaar',
        location: { lat: 28.6328, lng: 77.2197 },
        rates: { car: 40, bike: 15, suv: 60, evMultiplier: 1.3, evPerKwh: 17 },
        amenities: ['Subway Tunnel Access', '24/7 Monitored CCTV', 'Fire Suppression', 'Disabled Friendly', 'EV Fast Charge'],
        totalSlots: 24,
        availableSlots: 14,
        floors: ['Ground', 'B1'],
        rating: 4.7,
        totalReviews: 95,
        imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 11 2341 9090',
        operatingHours: '24/7 Open',
        createdAt: '2026-01-20T10:00:00.000Z'
      },
      // HYDERABAD
      {
        id: 'fac_hyd_1',
        name: 'Hitec City Mindspace Garage',
        ownerId: 'usr_owner_1',
        ownerName: 'Rajesh Sharma',
        address: 'Mindspace Madhapur Road',
        city: 'Hyderabad',
        area: 'Hitec City',
        landmark: 'Opposite Inorbit Mall & Cyber Towers',
        location: { lat: 17.4399, lng: 78.3794 },
        rates: { car: 45, bike: 20, suv: 65, evMultiplier: 1.35, evPerKwh: 18 },
        amenities: ['EV Station (4 Ports)', 'Covered Shade', 'Shuttle to Tech Park', 'Automated Pay-on-Foot'],
        totalSlots: 22,
        availableSlots: 13,
        floors: ['Ground', 'B1', 'B2'],
        rating: 4.7,
        totalReviews: 76,
        imageUrl: 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=1200&q=80',
        isVerified: true,
        evChargingAvailable: true,
        contactNumber: '+91 40 4455 7788',
        operatingHours: '24/7 Open',
        createdAt: '2026-02-01T11:00:00.000Z'
      }
    ];

    for (const fac of facilitiesList) {
      this.facilities.set(fac.id, fac);
      this.seedSlotsForFacility(fac);
    }

    // Seed Sample Past and Active Bookings
    await this.seedSampleBookings();
  }

  private seedSlotsForFacility(facility: ParkingFacility) {
    const floorList = facility.floors;
    let slotCount = 0;

    floorList.forEach((floor, fIdx) => {
      const slotsPerFloor = Math.ceil(facility.totalSlots / floorList.length);
      for (let i = 1; i <= slotsPerFloor; i++) {
        slotCount++;
        if (slotCount > facility.totalSlots) break;

        const prefix = floor === 'Ground' ? 'G' : floor;
        const slotNumber = `${prefix}-${i < 10 ? '0' + i : i}`;
        const slotId = `slot_${facility.id}_${slotNumber.replace('-', '_')}`;

        // Structured slot assignment:
        // - EV Fast Charging bays (slot 1, 4, 8, 12...)
        // - Bike Parking bays (slot 3, 6, 9, 15...)
        // - Car & SUV bays (remaining)
        const isEV = (slotCount % 4 === 1) || (facility.area === 'Velachery' && slotCount <= 8) || (facility.area === 'OMR' && slotCount <= 8);
        const isBike = !isEV && (slotCount % 3 === 0 || facility.area === 'T. Nagar' && slotCount <= 12);
        const isSUV = !isEV && !isBike && (slotCount % 5 === 0);

        let type: ParkingSlot['type'] = 'car';
        if (isEV) type = 'ev';
        else if (isBike) type = 'bike';
        else if (isSUV) type = 'suv';

        // Deterministic realistic status pattern
        let status: ParkingSlot['status'] = 'available';
        if (slotCount === 2 || slotCount === 7) status = 'occupied';
        else if (slotCount === 5) status = 'reserved';

        const basePrice = type === 'bike' ? facility.rates.bike :
          type === 'suv' ? facility.rates.suv :
          type === 'ev' ? Math.round(facility.rates.car * facility.rates.evMultiplier) :
          facility.rates.car;

        // Connector assignment for EV
        const connectorOptions = [
          { type: 'CCS2 (60kW DC)', power: 60, priceKwh: facility.rates.evPerKwh || 18 },
          { type: 'Type 2 (22kW AC)', power: 22, priceKwh: 15 },
          { type: 'CCS2 (120kW DC Hypercharger)', power: 120, priceKwh: 22 },
          { type: 'Bharat AC001 (3.3kW)', power: 3.3, priceKwh: 12 }
        ];
        const assignedConnector = connectorOptions[slotCount % connectorOptions.length];

        const slot: ParkingSlot = {
          id: slotId,
          facilityId: facility.id,
          slotNumber,
          floor,
          type,
          status,
          pricePerHour: basePrice,
          hasEVCharger: isEV,
          evDetails: isEV ? {
            connectorType: assignedConnector.type,
            chargingPowerKw: assignedConnector.power,
            pricePerKwh: assignedConnector.priceKwh,
            connectorStatus: status === 'available' ? 'available' : status === 'occupied' ? 'charging' : 'reserved'
          } : undefined,
          bikeDetails: isBike ? {
            hasHelmetLocker: true,
            isCovered: true,
            bayWidthMeters: 1.2
          } : undefined,
          distanceToExitMeters: 10 + (i * 3) + (fIdx * 15)
        };

        this.slots.set(slot.id, slot);
      }
    });

    // Recompute counts on facility
    this.recomputeFacilitySlots(facility.id);
  }

  public recomputeFacilitySlots(facilityId: string) {
    const fac = this.facilities.get(facilityId);
    if (!fac) return;
    const allFacilitySlots = Array.from(this.slots.values()).filter(s => s.facilityId === facilityId);
    fac.totalSlots = allFacilitySlots.length;
    fac.availableSlots = allFacilitySlots.filter(s => s.status === 'available').length;
    fac.carSlotsCount = allFacilitySlots.filter(s => s.type === 'car' || s.type === 'suv' || s.type === 'accessible').length;
    fac.bikeSlotsCount = allFacilitySlots.filter(s => s.type === 'bike').length;
    fac.evSlotsCount = allFacilitySlots.filter(s => s.hasEVCharger).length;
  }

  private async seedSampleBookings() {
    const now = new Date();
    const qrDataUrl1 = await QRCode.toDataURL(JSON.stringify({
      code: 'PK-2026-4892',
      facility: 'Indiranagar Metro Smart Hub',
      slot: 'G-04',
      vehicle: 'KA-01-MJ-4590'
    }));

    const sampleActiveBooking: Booking = {
      id: 'bk_sample_active_1',
      bookingCode: 'PK-2026-4892',
      userId: 'usr_commuter_1',
      userName: 'Arjun Mehta',
      userEmail: 'arjun@commuter.com',
      facilityId: 'fac_blr_1',
      facilityName: 'Indiranagar Metro Smart Hub',
      facilityAddress: '100 Feet Rd, HAL 2nd Stage, Indiranagar',
      slotId: 'slot_fac_blr_1_G_04',
      slotNumber: 'G-04',
      vehicleType: 'car',
      vehicleNumber: 'KA-01-MJ-4590',
      startTime: new Date(now.getTime() - 3600000).toISOString(),
      endTime: new Date(now.getTime() + 7200000).toISOString(),
      durationHours: 3,
      totalAmount: 150,
      paymentStatus: 'paid',
      paymentMethod: 'razorpay',
      transactionId: 'pay_rzp_mock_983192',
      status: 'confirmed',
      qrCodeDataUrl: qrDataUrl1,
      createdAt: new Date(now.getTime() - 3800000).toISOString()
    };
    this.bookings.set(sampleActiveBooking.id, sampleActiveBooking);

    // Seed a Chennai EV booking
    const qrDataUrl2 = await QRCode.toDataURL(JSON.stringify({
      code: 'PK-2026-1102',
      facility: 'Anna Nagar Roundtana Smart Parking & EV Hub',
      slot: 'G-01',
      vehicle: 'TN-09-CB-1234'
    }));

    const sampleChennaiEVBooking: Booking = {
      id: 'bk_sample_chn_1',
      bookingCode: 'PK-2026-1102',
      userId: 'usr_commuter_2',
      userName: 'Kavitha Sundaram',
      userEmail: 'kavitha@commuter.com',
      facilityId: 'fac_chn_anna',
      facilityName: 'Anna Nagar Roundtana Smart Parking & EV Hub',
      facilityAddress: '2nd Avenue, Near Roundtana, Anna Nagar',
      slotId: 'slot_fac_chn_anna_G_01',
      slotNumber: 'G-01',
      vehicleType: 'ev',
      vehicleNumber: 'TN-09-CB-1234',
      startTime: new Date(now.getTime() - 1800000).toISOString(),
      endTime: new Date(now.getTime() + 5400000).toISOString(),
      durationHours: 2,
      totalAmount: 108,
      paymentStatus: 'paid',
      paymentMethod: 'demo',
      transactionId: 'tx_chn_ev_9921',
      status: 'active',
      qrCodeDataUrl: qrDataUrl2,
      checkedInAt: new Date(now.getTime() - 1200000).toISOString(),
      createdAt: new Date(now.getTime() - 2000000).toISOString()
    };
    this.bookings.set(sampleChennaiEVBooking.id, sampleChennaiEVBooking);
  }

  // Concurrency Lock implementation for slot selection
  public acquireSlotLock(slotId: string, userId: string, ttlSeconds = 300): { success: boolean; message?: string } {
    const now = Date.now();
    const existingLock = this.slotLocks.get(slotId);

    if (existingLock && existingLock.expiresAt > now && existingLock.userId !== userId) {
      return { success: false, message: 'This slot is currently being held by another commuter. Please choose an adjacent slot or wait 5 minutes.' };
    }

    const slot = this.slots.get(slotId);
    if (!slot) return { success: false, message: 'Slot not found.' };
    if (slot.status !== 'available') {
      return { success: false, message: `Slot is already ${slot.status}.` };
    }

    this.slotLocks.set(slotId, {
      userId,
      expiresAt: now + (ttlSeconds * 1000)
    });

    return { success: true };
  }

  public releaseSlotLock(slotId: string, userId?: string) {
    if (userId) {
      const lock = this.slotLocks.get(slotId);
      if (lock && lock.userId === userId) {
        this.slotLocks.delete(slotId);
      }
    } else {
      this.slotLocks.delete(slotId);
    }
  }

  // Create booking with concurrency check
  public async createBooking(params: {
    userId: string;
    facilityId: string;
    slotId: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    paymentMethod: 'razorpay' | 'demo' | 'upi';
    transactionId?: string;
  }): Promise<Booking> {
    const slot = this.slots.get(params.slotId);
    if (!slot) throw new Error('Parking slot not found');

    const lock = this.slotLocks.get(params.slotId);
    if (lock && lock.expiresAt > Date.now() && lock.userId !== params.userId) {
      throw new Error('Slot temporary lock held by another customer.');
    }

    if (slot.status !== 'available' && slot.currentBookingId) {
      throw new Error('This slot is already occupied or reserved.');
    }

    const user = this.users.get(params.userId);
    const facility = this.facilities.get(params.facilityId);
    if (!facility) throw new Error('Parking facility not found');

    // Generate verified unique booking code
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `PK-${new Date().getFullYear()}-${randomDigits}`;

    const totalAmount = slot.pricePerHour * params.durationHours;

    // Generate real scannable QR ticket
    const qrPayload = JSON.stringify({
      code: bookingCode,
      facilityId: facility.id,
      facilityName: facility.name,
      slotNumber: slot.slotNumber,
      user: user?.name || 'Commuter',
      plate: params.vehicleNumber,
      validUntil: params.endTime
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const booking: Booking = {
      id: bookingId,
      bookingCode,
      userId: params.userId,
      userName: user?.name || 'Commuter User',
      userEmail: user?.email || 'commuter@parkingspot.ai',
      facilityId: facility.id,
      facilityName: facility.name,
      facilityAddress: facility.address,
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      vehicleType: params.vehicleType,
      vehicleNumber: params.vehicleNumber,
      startTime: params.startTime,
      endTime: params.endTime,
      durationHours: params.durationHours,
      totalAmount,
      paymentStatus: 'paid',
      paymentMethod: params.paymentMethod,
      transactionId: params.transactionId || `tx_${Date.now()}`,
      status: 'confirmed',
      qrCodeDataUrl,
      createdAt: new Date().toISOString()
    };

    // Update slot state atomically
    slot.status = 'reserved';
    slot.currentBookingId = booking.id;
    slot.reservedUntil = params.endTime;

    // Release lock
    this.releaseSlotLock(slot.id);

    // Save booking
    this.bookings.set(booking.id, booking);

    // Recompute facility available slots
    this.recomputeFacilitySlots(facility.id);

    return booking;
  }

  // Cancel booking
  public cancelBooking(bookingId: string, userId: string): Booking {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.userId !== userId && !userId.includes('admin') && !userId.includes('owner')) {
      throw new Error('Unauthorized to cancel this booking');
    }

    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';

    const slot = this.slots.get(booking.slotId);
    if (slot) {
      slot.status = 'available';
      slot.currentBookingId = undefined;
      slot.reservedUntil = undefined;
      this.recomputeFacilitySlots(slot.facilityId);
    }

    return booking;
  }

  // Check-in with QR code (Owner terminal)
  public checkInWithCode(code: string, ownerFacilityIds: string[]): { booking: Booking; message: string } {
    const booking = Array.from(this.bookings.values()).find(b => b.bookingCode.toUpperCase() === code.trim().toUpperCase());
    if (!booking) throw new Error('Invalid QR Ticket: Booking record not found.');

    if (!ownerFacilityIds.includes(booking.facilityId) && !ownerFacilityIds.includes('admin')) {
      throw new Error('This ticket belongs to a different parking facility.');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Ticket was cancelled and refunded.');
    }

    if (booking.status === 'completed') {
      throw new Error('Ticket has already been completed and exited.');
    }

    booking.status = 'active';
    booking.checkedInAt = new Date().toISOString();

    const slot = this.slots.get(booking.slotId);
    if (slot) {
      slot.status = 'occupied';
      this.recomputeFacilitySlots(slot.facilityId);
    }

    return { booking, message: `Vehicle ${booking.vehicleNumber} checked in successfully to slot ${booking.slotNumber}` };
  }

  // Check-out with QR code (Owner terminal)
  public checkOutWithCode(code: string, ownerFacilityIds: string[]): { booking: Booking; message: string } {
    const booking = Array.from(this.bookings.values()).find(b => b.bookingCode.toUpperCase() === code.trim().toUpperCase());
    if (!booking) throw new Error('Invalid QR Ticket: Booking record not found.');

    if (!ownerFacilityIds.includes(booking.facilityId) && !ownerFacilityIds.includes('admin')) {
      throw new Error('This ticket belongs to a different parking facility.');
    }

    booking.status = 'completed';
    booking.checkedOutAt = new Date().toISOString();

    const slot = this.slots.get(booking.slotId);
    if (slot) {
      slot.status = 'available';
      slot.currentBookingId = undefined;
      slot.reservedUntil = undefined;
      this.recomputeFacilitySlots(slot.facilityId);
    }

    return { booking, message: `Vehicle ${booking.vehicleNumber} checked out successfully. Slot ${booking.slotNumber} is now freed.` };
  }

  // Analytics generation backed by real counts
  public getPlatformAnalytics(): PlatformAnalytics {
    const allBookings = Array.from(this.bookings.values());
    const allSlots = Array.from(this.slots.values());
    const allFacilities = Array.from(this.facilities.values());
    const allUsers = Array.from(this.users.values());

    const totalRevenue = allBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const occupiedSlots = allSlots.filter(s => s.status === 'occupied' || s.status === 'reserved').length;
    const overallOccupancyRate = allSlots.length > 0 ? Math.round((occupiedSlots / allSlots.length) * 100) : 0;

    // Real categorised slot counts
    const carSpaces = allSlots.filter(s => s.type === 'car' || s.type === 'suv' || s.type === 'accessible').length;
    const bikeSpaces = allSlots.filter(s => s.type === 'bike').length;
    const evChargingStations = allSlots.filter(s => s.hasEVCharger || s.type === 'ev').length;

    const availableCarSpaces = allSlots.filter(s => (s.type === 'car' || s.type === 'suv' || s.type === 'accessible') && s.status === 'available').length;
    const availableBikeSpaces = allSlots.filter(s => s.type === 'bike' && s.status === 'available').length;
    const availableEVStations = allSlots.filter(s => (s.hasEVCharger || s.type === 'ev') && s.status === 'available').length;

    const cityMap: Record<string, { facilities: number; slots: number; car: number; bike: number; ev: number }> = {};
    for (const fac of allFacilities) {
      if (!cityMap[fac.city]) cityMap[fac.city] = { facilities: 0, slots: 0, car: 0, bike: 0, ev: 0 };
      cityMap[fac.city].facilities++;
      cityMap[fac.city].slots += fac.totalSlots;
      cityMap[fac.city].car += fac.carSlotsCount || 0;
      cityMap[fac.city].bike += fac.bikeSlotsCount || 0;
      cityMap[fac.city].ev += fac.evSlotsCount || 0;
    }

    const cityDistribution = Object.entries(cityMap).map(([city, data]) => ({
      city,
      facilitiesCount: data.facilities,
      slotsCount: data.slots,
      carCount: data.car,
      bikeCount: data.bike,
      evCount: data.ev
    }));

    const peakHours = [
      { hour: '08:00 - 10:00', bookingsCount: 142 },
      { hour: '10:00 - 12:00', bookingsCount: 268 },
      { hour: '12:00 - 14:00', bookingsCount: 185 },
      { hour: '14:00 - 16:00', bookingsCount: 194 },
      { hour: '16:00 - 18:00', bookingsCount: 312 },
      { hour: '18:00 - 20:00', bookingsCount: 279 },
      { hour: '20:00 - 22:00', bookingsCount: 130 }
    ];

    return {
      totalFacilities: allFacilities.length,
      totalSlots: allSlots.length,
      carSpaces,
      bikeSpaces,
      evChargingStations,
      availableCarSpaces,
      availableBikeSpaces,
      availableEVStations,
      totalBookings: allBookings.length,
      activeBookings: allBookings.filter(b => b.status === 'confirmed' || b.status === 'active').length,
      totalRevenue,
      overallOccupancyRate,
      roleBreakdown: {
        commuters: allUsers.filter(u => u.role === 'commuter').length,
        owners: allUsers.filter(u => u.role === 'owner').length,
        admins: allUsers.filter(u => u.role === 'admin').length
      },
      cityDistribution,
      peakHours,
      recentBookings: allBookings.slice(-10).reverse()
    };
  }

  // Location management
  public getLocations(): ManagedLocation[] {
    return Array.from(this.locations.values());
  }

  public updateLocation(city: string, updates: Partial<ManagedLocation>): ManagedLocation {
    const loc = this.locations.get(city.toLowerCase());
    if (!loc) throw new Error('Location not found');
    Object.assign(loc, updates);
    return loc;
  }

  // User management
  public getAllUsers(): User[] {
    return Array.from(this.users.values()).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      vehicleNumber: u.vehicleNumber,
      vehicleType: u.vehicleType,
      isActive: u.isActive ?? true,
      totalBookings: Array.from(this.bookings.values()).filter(b => b.userId === u.id).length,
      createdAt: u.createdAt
    }));
  }

  public updateUserRole(userId: string, newRole: User['role'], isActive?: boolean): User {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    user.role = newRole;
    if (isActive !== undefined) user.isActive = isActive;
    return user;
  }

  // Token Revocation (Session fully cleared on logout)
  public revokeToken(token: string): void {
    if (token) {
      this.revokedTokens.add(token);
    }
  }

  public isTokenRevoked(token: string): boolean {
    return this.revokedTokens.has(token);
  }

  // Password Recovery Flow
  public createPasswordResetToken(email: string): { token: string; expiresAt: Date } | null {
    const normalizedEmail = email.toLowerCase().trim();
    const user = Array.from(this.users.values()).find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) return null;

    // Cryptographically secure, time-limited, single-use token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAtMs = Date.now() + 15 * 60 * 1000; // 15 minutes expiry
    this.resetTokens.set(token, { email: normalizedEmail, expiresAt: expiresAtMs });

    return { token, expiresAt: new Date(expiresAtMs) };
  }

  public verifyResetToken(token: string): { valid: boolean; email?: string; message?: string } {
    const record = this.resetTokens.get(token);
    if (!record) {
      return { valid: false, message: 'Invalid or already used password reset token.' };
    }
    if (Date.now() > record.expiresAt) {
      this.resetTokens.delete(token);
      return { valid: false, message: 'Password reset token has expired. Please request a new link.' };
    }
    return { valid: true, email: record.email };
  }

  public resetPasswordWithToken(token: string, newPassword: string): { success: boolean; message: string } {
    const check = this.verifyResetToken(token);
    if (!check.valid || !check.email) {
      return { success: false, message: check.message || 'Invalid or expired token.' };
    }

    const user = Array.from(this.users.values()).find(u => u.email.toLowerCase() === check.email);
    if (!user) {
      return { success: false, message: 'User associated with this token not found.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    // Single-use token: remove immediately
    this.resetTokens.delete(token);

    return { success: true, message: 'Password reset successfully. You can now log in.' };
  }
}

export const parkingStore = new ParkingStore();
