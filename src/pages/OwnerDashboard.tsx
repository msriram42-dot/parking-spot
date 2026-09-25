import React, { useState, useEffect } from 'react';
import { Building2, Plus, QrCode, TrendingUp, Users, DollarSign, Activity, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { ParkingFacility, ParkingSlot, Booking } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { InteractiveParkingLot } from '../components/InteractiveParkingLot.tsx';
import { NewFacilityModal } from '../components/NewFacilityModal.tsx';
import { QRScannerModal } from '../components/QRScannerModal.tsx';
import { useSocket } from '../context/SocketContext.tsx';

interface OwnerDashboardProps {
  onBack?: () => void;
  onHome?: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onBack, onHome }) => {
  const { user } = useAuth();
  const { lastUpdatedSlot } = useSocket();
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<ParkingFacility | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      const facRes = await api.getFacilities();
      // Facilities owned by this user (or all if admin)
      const myFacilities = facRes.facilities.filter(f => f.ownerId === user?.id || user?.role === 'admin');
      setFacilities(myFacilities);

      const activeFac = selectedFacility || myFacilities[0];
      if (activeFac) {
        setSelectedFacility(activeFac);
        const [slotsRes, bookingsRes, analyticsRes] = await Promise.all([
          api.getSlots(activeFac.id),
          api.getFacilityBookings(activeFac.id),
          api.getFacilityAnalytics(activeFac.id)
        ]);
        setSlots(slotsRes.slots);
        setBookings(bookingsRes.bookings);
        setAnalytics(analyticsRes.analytics);
      }
    } catch (err) {
      console.error('Failed to load owner dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedFacility) return;
    const loadFacilityDetails = async () => {
      try {
        const [slotsRes, bookingsRes, analyticsRes] = await Promise.all([
          api.getSlots(selectedFacility.id),
          api.getFacilityBookings(selectedFacility.id),
          api.getFacilityAnalytics(selectedFacility.id)
        ]);
        setSlots(slotsRes.slots);
        setBookings(bookingsRes.bookings);
        setAnalytics(analyticsRes.analytics);
      } catch (e) {
        console.error(e);
      }
    };
    loadFacilityDetails();
  }, [selectedFacility?.id]);

  // Socket real-time slot update
  useEffect(() => {
    if (lastUpdatedSlot && selectedFacility && lastUpdatedSlot.facilityId === selectedFacility.id) {
      setSlots(prev => prev.map(s => s.id === lastUpdatedSlot.slot.id ? lastUpdatedSlot.slot : s));
    }
  }, [lastUpdatedSlot, selectedFacility?.id]);

  // Owner toggles slot status directly
  const handleToggleSlotStatus = async (slotId: string, newStatus: ParkingSlot['status']) => {
    try {
      const res = await api.updateSlot(slotId, { status: newStatus });
      setSlots(prev => prev.map(s => s.id === slotId ? res.slot : s));
    } catch (err) {
      console.error('Failed to update slot status', err);
    }
  };

  const handleFacilityCreated = (newFac: ParkingFacility) => {
    setFacilities(prev => [newFac, ...prev]);
    setSelectedFacility(newFac);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-[#312E81]">
      
      {/* Top Navigation Bar with Back & Home Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 bg-white rounded-2xl border border-[#EDE9FE] shadow-xs">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#EDE9FE] text-[#312E81] text-xs font-bold transition-all border border-[#EDE9FE] cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#7C3AED]" />
              <span>Back</span>
            </button>
          )}
          {onHome && (
            <button
              onClick={onHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#EDE9FE] text-[#312E81] text-xs font-bold transition-all border border-[#EDE9FE] cursor-pointer shadow-xs active:scale-95"
            >
              <Home className="w-4 h-4 text-[#7C3AED]" />
              <span>Home</span>
            </button>
          )}
          <span className="text-xs font-bold text-[#6B7280] ml-2 hidden sm:inline">
            Operator Console: {user?.name || 'Facility Owner'}
          </span>
        </div>

        <button
          onClick={fetchOwnerData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#EDE9FE] text-[#7C3AED] text-xs font-bold transition-colors border border-[#EDE9FE] cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#312E81]">Facility Owner Command Center</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
              Live Operations
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">Manage real-time bay occupancy, verify QR passes, and monitor revenue</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* QR Verification Scanner Terminal Button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#7C3AED]/20 active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Verify QR Ticket</span>
          </button>

          {/* Add Facility Button */}
          <button
            onClick={() => setIsAddFacilityOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-[#F8F5FF] text-[#312E81] font-bold text-xs rounded-xl border border-[#EDE9FE] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#7C3AED]" />
            <span>Add Facility</span>
          </button>
        </div>
      </div>

      {/* Facility Selector */}
      {facilities.length > 0 && (
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#EDE9FE] shadow-xs overflow-x-auto">
          <span className="text-xs font-semibold text-[#6B7280] px-2 shrink-0">Selected Property:</span>
          {facilities.map(fac => (
            <button
              key={fac.id}
              onClick={() => setSelectedFacility(fac)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedFacility?.id === fac.id
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#4B5563] hover:text-[#312E81] hover:bg-[#F8F5FF]'
              }`}
            >
              {fac.name} ({fac.city})
            </button>
          ))}
        </div>
      )}

      {/* Key Metric Gauges */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-[#EDE9FE] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280] uppercase">Live Occupancy</span>
              <Activity className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#7C3AED] mt-2">
              {analytics.occupancyRate}%
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              {slots.filter(s => s.status === 'occupied').length} of {slots.length} bays occupied
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#EDE9FE] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280] uppercase">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#312E81] mt-2">
              ₹{analytics.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">Across all confirmed sessions</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#EDE9FE] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280] uppercase">Active Passes</span>
              <Users className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#312E81] mt-2">
              {analytics.activeBookings}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">Vehicles currently parked</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#EDE9FE] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280] uppercase">All-Time Bookings</span>
              <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#312E81] mt-2">
              {analytics.totalBookings}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">Completed checkouts</p>
          </div>
        </div>
      )}

      {/* Real-time Interactive Lot for Owner */}
      {selectedFacility && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#312E81]">Live Bay Management Layout</h2>
            <p className="text-xs text-[#6B7280]">Click any bay to mark Occupied or Available manually</p>
          </div>
          <InteractiveParkingLot
            facility={selectedFacility}
            slots={slots}
            selectedSlotId={selectedSlotId}
            onSelectSlot={(slot) => setSelectedSlotId(slot.id)}
            isOwnerView={true}
            onToggleSlotStatus={handleToggleSlotStatus}
          />
        </div>
      )}

      {/* Recent Facility Bookings Audit List */}
      <div className="bg-white rounded-3xl border border-[#EDE9FE] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#EDE9FE] flex items-center justify-between bg-[#F8F5FF]">
          <div>
            <h3 className="text-sm font-bold text-[#312E81]">Recent Facility Bookings & Digital Passes</h3>
            <p className="text-xs text-[#6B7280]">Transactions recorded for this property</p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#EDE9FE] text-[#7C3AED] text-xs font-bold">
            {bookings.length} Bookings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F5FF] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#EDE9FE]">
              <tr>
                <th className="py-3 px-4">Pass Code</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Time Window</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9FE]">
              {bookings.slice(0, 10).map(b => (
                <tr key={b.id} className="hover:bg-[#F8F5FF] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#7C3AED]">
                    {b.bookingCode}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#312E81]">
                    Slot {b.slotNumber}
                  </td>
                  <td className="py-3.5 px-4 text-[#4B5563]">
                    <span className="font-mono text-[#312E81]">{b.vehicleNumber}</span> ({b.vehicleType})
                  </td>
                  <td className="py-3.5 px-4 text-[#6B7280]">
                    {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#312E81]">
                    ₹{b.totalAmount}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      b.status === 'confirmed' || b.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      b.status === 'completed' ? 'bg-[#EDE9FE] text-[#7C3AED]' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isAddFacilityOpen && (
        <NewFacilityModal
          isOpen={isAddFacilityOpen}
          onClose={() => setIsAddFacilityOpen(false)}
          onFacilityCreated={handleFacilityCreated}
        />
      )}

      {isScannerOpen && (
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onVerificationComplete={() => fetchOwnerData()}
        />
      )}
    </div>
  );
};
