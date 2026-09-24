import React, { useState } from 'react';
import { ParkingSlot, ParkingFacility } from '../types/index.ts';
import { Zap, Car, Bike, ArrowRight } from 'lucide-react';

interface InteractiveParkingLotProps {
  facility: ParkingFacility;
  slots: ParkingSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: ParkingSlot) => void;
  onInitiateBooking?: (slot: ParkingSlot) => void;
  isOwnerView?: boolean;
  onToggleSlotStatus?: (slotId: string, newStatus: ParkingSlot['status']) => void;
}

export const InteractiveParkingLot: React.FC<InteractiveParkingLotProps> = ({
  facility,
  slots,
  selectedSlotId,
  onSelectSlot,
  onInitiateBooking,
  isOwnerView = false,
  onToggleSlotStatus
}) => {
  const [selectedFloor, setSelectedFloor] = useState<string>(facility.floors[0] || 'Ground');
  const [filterType, setFilterType] = useState<string>('all');

  // Filter slots for current floor
  const floorSlots = slots.filter(s => s.floor === selectedFloor);
  const displaySlots = filterType === 'all' 
    ? floorSlots 
    : filterType === 'ev' 
      ? floorSlots.filter(s => s.hasEVCharger) 
      : floorSlots.filter(s => s.type === filterType);

  const selectedSlot = slots.find(s => s.id === selectedSlotId);

  // Divide slots into two bays (Bay A and Bay B) with a central drive aisle
  const half = Math.ceil(displaySlots.length / 2);
  const bayA = displaySlots.slice(0, half);
  const bayB = displaySlots.slice(half);

  const getStatusColorClass = (slot: ParkingSlot) => {
    if (slot.id === selectedSlotId) {
      return 'ring-4 ring-[#7C3AED] ring-offset-2 ring-offset-white scale-102 z-10 shadow-lg shadow-[#7C3AED]/25 border-[#7C3AED]';
    }
    if (slot.status === 'occupied') {
      return 'bg-red-50 border-red-300 text-red-700 opacity-80 cursor-not-allowed';
    }
    if (slot.status === 'reserved') {
      return 'bg-amber-50 border-amber-300 text-amber-700 opacity-90 cursor-not-allowed';
    }
    if (slot.hasEVCharger) {
      return 'bg-[#EDE9FE] border-[#7C3AED] text-[#5B21B6] hover:bg-[#DDD6FE] hover:shadow-md';
    }
    return 'bg-white border-emerald-500 text-emerald-800 hover:bg-emerald-50 hover:shadow-md';
  };

  const getSlotIcon = (slot: ParkingSlot) => {
    if (slot.hasEVCharger) return <Zap className="w-3.5 h-3.5 text-[#7C3AED] fill-[#7C3AED]" />;
    if (slot.type === 'bike') return <Bike className="w-3.5 h-3.5 text-[#7C3AED]" />;
    return <Car className="w-3.5 h-3.5 text-[#312E81]" />;
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EDE9FE] p-4 sm:p-6 shadow-xs text-[#312E81]">
      {/* Top Bar: Floor selector and filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#EDE9FE]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Level / Floor:</span>
          <div className="flex items-center bg-[#F8F5FF] rounded-2xl p-1 border border-[#EDE9FE]">
            {facility.floors.map(floor => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFloor === floor
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#312E81]'
                }`}
              >
                {floor}
              </button>
            ))}
          </div>
        </div>

        {/* Filter by vehicle / EV */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-[#6B7280] mr-1 hidden sm:inline">Filter:</span>
          {['all', 'car', 'ev', 'suv', 'bike'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                filterType === type
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                  : 'bg-[#F8F5FF] text-[#6B7280] border-[#EDE9FE] hover:text-[#312E81]'
              }`}
            >
              {type === 'ev' ? '⚡ EV Charging' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Parking Floor Layout Map */}
      <div className="mt-6 p-4 sm:p-6 bg-[#F8F5FF] rounded-2xl border border-[#EDE9FE] overflow-x-auto">
        <div className="min-w-[640px] space-y-4">
          
          {/* Bay A (Top Row of Slots) */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#6B7280] mb-2 px-1">
              <span>BAY A (North Entrance Wing)</span>
              <span>Slots 01 - {half.toString().padStart(2, '0')}</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
              {bayA.map(slot => (
                <div
                  key={slot.id}
                  onClick={() => {
                    if (slot.status === 'available' || isOwnerView) {
                      onSelectSlot(slot);
                    }
                  }}
                  className={`relative p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-between h-20 cursor-pointer ${getStatusColorClass(slot)}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black">{slot.slotNumber}</span>
                    {getSlotIcon(slot)}
                  </div>
                  
                  <div className="text-center w-full">
                    <span className="text-[9px] font-bold block uppercase tracking-tight">
                      {slot.status}
                    </span>
                    {slot.hasEVCharger && (
                      <span className="text-[8px] font-bold text-[#7C3AED] block">
                        60kW
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Central Drive Aisle */}
          <div className="py-4 my-2 border-y-2 border-dashed border-[#EDE9FE] bg-white/70 rounded-xl flex items-center justify-between px-6 text-xs font-bold text-[#6B7280] tracking-widest uppercase">
            <span>◄ ENTRY LANE (ONE WAY)</span>
            <span className="text-[#7C3AED]">SPEED LIMIT: 10 KM/H</span>
            <span>EXIT BARRIER ►</span>
          </div>

          {/* Bay B (Bottom Row of Slots) */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#6B7280] mb-2 px-1">
              <span>BAY B (South Wing)</span>
              <span>Slots {(half + 1).toString().padStart(2, '0')} - {displaySlots.length.toString().padStart(2, '0')}</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
              {bayB.map(slot => (
                <div
                  key={slot.id}
                  onClick={() => {
                    if (slot.status === 'available' || isOwnerView) {
                      onSelectSlot(slot);
                    }
                  }}
                  className={`relative p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-between h-20 cursor-pointer ${getStatusColorClass(slot)}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black">{slot.slotNumber}</span>
                    {getSlotIcon(slot)}
                  </div>
                  
                  <div className="text-center w-full">
                    <span className="text-[9px] font-bold block uppercase tracking-tight">
                      {slot.status}
                    </span>
                    {slot.hasEVCharger && (
                      <span className="text-[8px] font-bold text-[#7C3AED] block">
                        60kW
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Slot Action Summary Drawer */}
      {selectedSlot && (
        <div className="mt-4 p-4 rounded-2xl bg-[#EDE9FE]/50 border border-[#A78BFA]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#EDE9FE] flex items-center justify-center text-[#7C3AED] font-black text-sm shrink-0">
              {selectedSlot.slotNumber}
            </div>
            <div>
              <p className="font-bold text-[#312E81] text-sm">
                Slot {selectedSlot.slotNumber} • {selectedSlot.floor} Floor
              </p>
              <p className="text-[#6B7280]">
                Type: <span className="uppercase font-bold text-[#7C3AED]">{selectedSlot.type}</span>
                {selectedSlot.hasEVCharger && ' • Fast EV Charger (60kW CCS2)'}
                {' • Status: '}
                <span className={`font-bold capitalize ${selectedSlot.status === 'available' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {selectedSlot.status}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedSlot.status === 'available' && (
              <button
                onClick={() => {
                  if (onInitiateBooking) onInitiateBooking(selectedSlot);
                  else onSelectSlot(selectedSlot);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-[#7C3AED]/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Reserve</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {isOwnerView && onToggleSlotStatus && (
              <button
                onClick={() => {
                  const nextStatus = selectedSlot.status === 'available' ? 'occupied' : 'available';
                  onToggleSlotStatus(selectedSlot.id, nextStatus);
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8F5FF] text-[#312E81] font-bold text-xs border border-[#EDE9FE] transition-all cursor-pointer"
              >
                Toggle Status: {selectedSlot.status === 'available' ? 'Mark Occupied' : 'Mark Available'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
