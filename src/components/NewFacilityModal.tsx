import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { ParkingFacility } from '../types/index.ts';

interface NewFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFacilityCreated: (facility: ParkingFacility) => void;
}

export const NewFacilityModal: React.FC<NewFacilityModalProps> = ({
  isOpen,
  onClose,
  onFacilityCreated
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Chennai');
  const [area, setArea] = useState('Anna Nagar');
  const [landmark, setLandmark] = useState('');
  const [carRate, setCarRate] = useState(50);
  const [bikeRate, setBikeRate] = useState(20);
  const [suvRate, setSuvRate] = useState(70);
  const [totalSlots, setTotalSlots] = useState(24);
  const [floors] = useState(['Ground', 'B1']);
  const [hasEV, setHasEV] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      setError('Facility name and address are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.createFacility({
        name,
        address,
        city,
        area: city === 'Chennai' ? area : undefined,
        landmark,
        rates: {
          car: Number(carRate),
          bike: Number(bikeRate),
          suv: Number(suvRate),
          evMultiplier: 1.3
        },
        totalSlots: Number(totalSlots),
        floors,
        amenities: [
          ...(hasEV ? ['EV Fast Charger'] : []),
          'CCTV 24/7',
          'Covered Shade',
          'Automated Barrier Gate',
          'Valet Assistance'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80'
      });

      onFacilityCreated(res.facility);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create facility');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#EDE9FE] shadow-2xl overflow-hidden text-[#312E81] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#EDE9FE] bg-[#F8F5FF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#312E81]">Add Parking Facility</h3>
              <p className="text-[11px] text-[#6B7280]">Onboard a new garage or lot to ParkingSpot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#312E81] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#312E81] mb-1">Facility Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Phoenix MarketCity Hub"
              className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-xl px-3.5 py-2 text-[#312E81] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#312E81] mb-1">City</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-xl px-3.5 py-2 text-[#312E81] focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="Chennai">Chennai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>

            {city === 'Chennai' ? (
              <div>
                <label className="block font-semibold text-[#312E81] mb-1">Chennai Zone</label>
                <select
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-xl px-3.5 py-2 text-[#312E81] focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="Anna Nagar">Anna Nagar</option>
                  <option value="T. Nagar">T. Nagar</option>
                  <option value="Velachery">Velachery</option>
                  <option value="Tambaram">Tambaram</option>
                  <option value="OMR">OMR</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-[#312E81] mb-1">Total Slots</label>
                <input
                  type="number"
                  min={6}
                  max={100}
                  value={totalSlots}
                  onChange={e => setTotalSlots(Number(e.target.value))}
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-xl px-3.5 py-2 text-[#312E81] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[#312E81] mb-1">Street Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 2nd Avenue, Anna Nagar East"
              className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-xl px-3.5 py-2 text-[#312E81] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#312E81] mb-1">Prominent Landmark</label>
            <input
              type="text"
              value={landmark}
              onChange={e => setLandmark(e.target.value)}
              placeholder="e.g. Near Metro Station Gate 2"
              className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-xl px-3.5 py-2 text-[#312E81] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          {/* Pricing Config */}
          <div>
            <label className="block font-semibold text-[#312E81] mb-1">Hourly Tariffs (₹/hour)</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-[#6B7280]">Car Rate</span>
                <input
                  type="number"
                  value={carRate}
                  onChange={e => setCarRate(Number(e.target.value))}
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-lg px-2.5 py-1.5 text-[#312E81]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280]">Bike Rate</span>
                <input
                  type="number"
                  value={bikeRate}
                  onChange={e => setBikeRate(Number(e.target.value))}
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-lg px-2.5 py-1.5 text-[#312E81]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280]">SUV Rate</span>
                <input
                  type="number"
                  value={suvRate}
                  onChange={e => setSuvRate(Number(e.target.value))}
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-lg px-2.5 py-1.5 text-[#312E81]"
                />
              </div>
            </div>
          </div>

          {/* EV Toggle */}
          <div className="p-3 bg-[#F8F5FF] rounded-2xl border border-[#EDE9FE] flex items-center justify-between">
            <div>
              <p className="font-bold text-[#312E81]">Equipped with EV Fast Chargers</p>
              <p className="text-[10px] text-[#6B7280]">Enables EV-designated slots on floor plan</p>
            </div>
            <input
              type="checkbox"
              checked={hasEV}
              onChange={e => setHasEV(e.target.checked)}
              className="w-4 h-4 accent-[#7C3AED] cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#EDE9FE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F8F5FF] hover:bg-[#EDE9FE] rounded-xl text-[#312E81] font-semibold cursor-pointer border border-[#EDE9FE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-bold transition-all shadow-md shadow-[#7C3AED]/20 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create & Generate Slots'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
