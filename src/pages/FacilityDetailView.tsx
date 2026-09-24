import React, { useState, useEffect } from 'react';
import { ArrowLeft, Home, Star, MapPin, Zap, Clock, Shield, Phone, Bike, Car, BatteryCharging, CheckCircle2 } from 'lucide-react';
import { ParkingFacility, ParkingSlot, Booking, VehicleType, ServiceSection } from '../types/index.ts';
import { api } from '../services/api.ts';
import { InteractiveParkingLot } from '../components/InteractiveParkingLot.tsx';
import { BookingModal } from '../components/BookingModal.tsx';
import { QRCodeModal } from '../components/QRCodeModal.tsx';
import { useSocket } from '../context/SocketContext.tsx';

interface FacilityDetailViewProps {
  facility: ParkingFacility;
  onBack: () => void;
  onHome: () => void;
  preSelectedSlotId?: string | null;
  initialDurationHours?: number;
  initialVehicleType?: VehicleType;
  initialSection?: ServiceSection;
}

export const FacilityDetailView: React.FC<FacilityDetailViewProps> = ({
  facility,
  onBack,
  onHome,
  preSelectedSlotId = null,
  initialDurationHours = 2,
  initialVehicleType = 'car',
  initialSection = 'all'
}) => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(preSelectedSlotId);
  const [slotToBook, setSlotToBook] = useState<ParkingSlot | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [slotTypeFilter, setSlotTypeFilter] = useState<'all' | 'car' | 'ev' | 'bike'>(
    initialSection === 'ev' ? 'ev' : initialSection === 'bike' ? 'bike' : initialSection === 'car' ? 'car' : 'all'
  );
  const { lastUpdatedSlot } = useSocket();

  const fetchSlots = async () => {
    try {
      const res = await api.getSlots(facility.id);
      setSlots(res.slots);
    } catch (err) {
      console.error('Failed to load facility slots', err);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [facility.id]);

  // Real-time slot update via Socket.IO
  useEffect(() => {
    if (lastUpdatedSlot && lastUpdatedSlot.facilityId === facility.id) {
      setSlots(prev => prev.map(s => s.id === lastUpdatedSlot.slot.id ? lastUpdatedSlot.slot : s));
    }
  }, [lastUpdatedSlot, facility.id]);

  // Handle slot reservation initiation
  const handleInitiateBooking = (slot: ParkingSlot) => {
    setSlotToBook(slot);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (booking: Booking) => {
    setConfirmedBooking(booking);
    setIsQRCodeModalOpen(true);
    fetchSlots(); // Refresh slot statuses
  };

  // Filter slots for interactive viewer
  const displayedSlots = slotTypeFilter === 'all'
    ? slots
    : slotTypeFilter === 'ev'
    ? slots.filter(s => s.hasEVCharger || s.type === 'ev')
    : slotTypeFilter === 'bike'
    ? slots.filter(s => s.type === 'bike')
    : slots.filter(s => s.type === 'car' || s.type === 'suv' || s.type === 'accessible');

  // Count metrics
  const evSlots = slots.filter(s => s.hasEVCharger || s.type === 'ev');
  const availableEVSlots = evSlots.filter(s => s.status === 'available');
  const bikeSlots = slots.filter(s => s.type === 'bike');
  const availableBikeSlots = bikeSlots.filter(s => s.status === 'available');
  const carSlots = slots.filter(s => s.type === 'car' || s.type === 'suv' || s.type === 'accessible');
  const availableCarSlots = carSlots.filter(s => s.status === 'available');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-[#312E81]">
      
      {/* Visible Navigation Toolbar (Back & Home Buttons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 bg-white rounded-2xl border border-[#EDE9FE] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#EDE9FE] text-[#312E81] text-xs font-bold transition-all border border-[#EDE9FE] cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#7C3AED]" />
            <span>Back to Search</span>
          </button>

          <button
            onClick={onHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#EDE9FE] text-[#312E81] text-xs font-bold transition-all border border-[#EDE9FE] cursor-pointer shadow-xs active:scale-95"
          >
            <Home className="w-4 h-4 text-[#7C3AED]" />
            <span>Home</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-[#6B7280]">Live availability:</span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {facility.availableSlots} of {facility.totalSlots} Slots Free
          </span>
        </div>
      </div>

      {/* Facility Banner Information */}
      <div className="bg-white rounded-3xl border border-[#EDE9FE] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <img
            src={facility.imageUrl}
            alt={facility.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[#EDE9FE] shadow-sm shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#312E81]">{facility.name}</h1>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#EDE9FE] text-[#7C3AED]">
                {facility.area || facility.city}
              </span>
              <div className="flex items-center gap-1 bg-amber-50 text-[#B45309] border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{facility.rating}</span>
                <span className="text-[#6B7280]">({facility.totalReviews})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-[#4B5563]">
                <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
                {facility.landmark || facility.address}, {facility.city}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
                {facility.operatingHours}
              </span>
            </div>

            {/* Quick Service Highlights */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#F8F5FF] text-[#312E81] border border-[#EDE9FE]">
                <Car className="w-3 h-3 text-[#7C3AED]" /> {availableCarSlots.length} Car Bays Available (₹{facility.rates.car}/hr)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#F8F5FF] text-[#312E81] border border-[#EDE9FE]">
                <Bike className="w-3 h-3 text-[#7C3AED]" /> {availableBikeSlots.length} Bike Bays Available (₹{facility.rates.bike}/hr)
              </span>
              {facility.evChargingAvailable && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#EDE9FE] text-[#7C3AED]">
                  <Zap className="w-3 h-3 fill-[#7C3AED]" /> {availableEVSlots.length} EV Ports Available (₹{facility.rates.evPerKwh || 18}/kWh)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rates Card */}
        <div className="bg-[#F8F5FF] rounded-2xl border border-[#EDE9FE] p-4 w-full md:w-auto shrink-0 space-y-2 text-xs">
          <p className="font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">Standard Tariffs</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white p-2.5 rounded-xl border border-[#EDE9FE]">
              <p className="text-[10px] text-[#6B7280]">Car</p>
              <p className="font-extrabold text-sm text-[#312E81]">₹{facility.rates.car}<span className="text-[10px] font-normal text-[#6B7280]">/hr</span></p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-[#EDE9FE]">
              <p className="text-[10px] text-[#7C3AED] font-bold">Bike</p>
              <p className="font-extrabold text-sm text-[#312E81]">₹{facility.rates.bike}<span className="text-[10px] font-normal text-[#6B7280]">/hr</span></p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-[#EDE9FE]">
              <p className="text-[10px] text-[#7C3AED] font-bold">EV Port</p>
              <p className="font-extrabold text-sm text-[#7C3AED]">₹{facility.rates.evPerKwh || 18}<span className="text-[10px] font-normal text-[#6B7280]">/kWh</span></p>
            </div>
          </div>
          <p className="text-[10px] text-[#6B7280] text-center font-medium">Contact: {facility.contactNumber}</p>
        </div>
      </div>

      {/* Filter Tabs for Slot Layout (Requirement 2: Separate sections for Car, EV, and Bike) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#EDE9FE] shadow-xs">
          <button
            onClick={() => setSlotTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              slotTypeFilter === 'all'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#312E81]'
            }`}
          >
            All Spaces ({slots.length})
          </button>
          <button
            onClick={() => setSlotTypeFilter('car')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              slotTypeFilter === 'car'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#312E81]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            Car Parking ({availableCarSlots.length} free)
          </button>
          <button
            onClick={() => setSlotTypeFilter('ev')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              slotTypeFilter === 'ev'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-[#7C3AED] hover:bg-[#EDE9FE]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            EV Charging ({availableEVSlots.length} free)
          </button>
          <button
            onClick={() => setSlotTypeFilter('bike')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              slotTypeFilter === 'bike'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-[#7C3AED] hover:bg-[#EDE9FE]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            Bike Parking ({availableBikeSlots.length} free)
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#6B7280] font-medium">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400" /> Reserved</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> Occupied</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#7C3AED]" /> EV Port</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#A78BFA]" /> Bike Bay</span>
        </div>
      </div>

      {/* EV Specific Connector Information Card if viewing EV */}
      {slotTypeFilter === 'ev' && (
        <div className="p-5 rounded-3xl bg-white border border-[#EDE9FE] shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-sm font-black text-[#312E81]">EV Charging Station Architecture</h3>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                Equipped with intelligent load-balancing chargers compatible with Tata, MG, Mahindra, Hyundai, and BYD vehicles.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE]">
                <span className="font-bold text-[#312E81]">Connector:</span> CCS2 Fast DC (60kW)
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE]">
                <span className="font-bold text-[#312E81]">Price:</span> ₹{facility.rates.evPerKwh || 18}/kWh
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bike Specific Information Card if viewing Bike */}
      {slotTypeFilter === 'bike' && (
        <div className="p-5 rounded-3xl bg-white border border-[#EDE9FE] shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-sm font-black text-[#312E81]">Dedicated Two-Wheeler Hub Features</h3>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                Optimized bay geometry for motorcycles, scooters, and EV two-wheelers with secure helmet storage lockers.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE]">
                <span className="font-bold text-[#312E81]">Price:</span> ₹{facility.rates.bike}/hour
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE]">
                <span className="font-bold text-[#312E81]">Security:</span> CCTV + Guard Patrolled
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Slot Layout Map Component */}
      <InteractiveParkingLot
        facility={facility}
        slots={displayedSlots}
        selectedSlotId={selectedSlotId}
        onSelectSlot={(slot) => {
          setSelectedSlotId(slot.id);
          handleInitiateBooking(slot);
        }}
      />

      {/* Booking Initiation Modal */}
      {slotToBook && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSlotToBook(null);
          }}
          facility={facility}
          slot={slotToBook}
          initialDurationHours={initialDurationHours}
          initialVehicleType={
            slotToBook.type === 'bike' ? 'bike' :
            slotToBook.hasEVCharger ? 'ev' :
            initialVehicleType
          }
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Scannable Pass Modal */}
      {confirmedBooking && (
        <QRCodeModal
          isOpen={isQRCodeModalOpen}
          onClose={() => {
            setIsQRCodeModalOpen(false);
            setConfirmedBooking(null);
          }}
          booking={confirmedBooking}
        />
      )}
    </div>
  );
};
