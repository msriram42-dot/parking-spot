import React from 'react';
import { ParkingFacility, ServiceSection } from '../types/index.ts';
import { Star, MapPin, Zap, Car, ArrowRight, Bike } from 'lucide-react';

interface FacilityCardProps {
  facility: ParkingFacility;
  onSelectFacility: (facility: ParkingFacility) => void;
  onViewOnMap?: (facility: ParkingFacility) => void;
  highlightSection?: ServiceSection;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  onSelectFacility,
  highlightSection = 'all'
}) => {
  const occupancyPercent = Math.round(((facility.totalSlots - facility.availableSlots) / facility.totalSlots) * 100);

  return (
    <div className="bg-white hover:bg-white rounded-3xl border border-[#EDE9FE] hover:border-[#A78BFA] transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md hover:shadow-[#7C3AED]/10 flex flex-col justify-between group">
      <div>
        {/* Facility Image with Live Status */}
        <div className="relative h-44 w-full overflow-hidden bg-[#EDE9FE]">
          <img
            src={facility.imageUrl}
            alt={facility.name}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Area & City Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-white/95 text-[#7C3AED] shadow-sm backdrop-blur-md">
              {facility.area || facility.city}
            </span>
            <span className="px-2 py-1 rounded-xl text-[11px] font-bold bg-[#312E81]/80 text-white backdrop-blur-md">
              {facility.city}
            </span>
            {facility.evChargingAvailable && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold bg-[#7C3AED] text-white shadow-sm">
                <Zap className="w-3 h-3 fill-white" /> EV Fast Hub
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-[#B45309] text-xs font-bold shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{facility.rating}</span>
            <span className="text-[10px] text-[#6B7280]">({facility.totalReviews})</span>
          </div>

          {/* Availability overlay at bottom of image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 text-[#065F46] text-xs font-bold backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{facility.availableSlots} of {facility.totalSlots} Free</span>
            </div>
            <span className="text-xs text-[#312E81] font-bold px-2.5 py-1 rounded-xl bg-white/95 shadow-sm">
              {highlightSection === 'bike' ? `Bike: ₹${facility.rates.bike}/hr` :
               highlightSection === 'ev' ? `From ₹${facility.rates.evPerKwh || 18}/kWh` :
               `From ₹${facility.rates.car}/hr`}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 sm:p-5">
          <h3 className="font-bold text-[#312E81] text-base group-hover:text-[#7C3AED] transition-colors line-clamp-1">
            {facility.name}
          </h3>

          <div className="flex items-start gap-1.5 text-[#6B7280] text-xs mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
            <p className="line-clamp-1">{facility.landmark || facility.address}</p>
          </div>

          {/* Availability progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-[#6B7280] font-semibold mb-1">
              <span>Live Bay Occupancy</span>
              <span className={occupancyPercent > 80 ? 'text-rose-600 font-bold' : 'text-[#7C3AED] font-bold'}>{occupancyPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#EDE9FE] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  occupancyPercent > 80 ? 'bg-rose-500' : occupancyPercent > 50 ? 'bg-amber-500' : 'bg-[#7C3AED]'
                }`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          {/* Rates breakdown strip */}
          <div className="grid grid-cols-3 gap-1.5 my-3 p-2 bg-[#F8F5FF] rounded-2xl border border-[#EDE9FE] text-center text-xs">
            <div className={highlightSection === 'car' ? 'bg-[#EDE9FE] rounded-xl py-1' : ''}>
              <p className="text-[10px] text-[#6B7280] flex items-center justify-center gap-1 font-semibold">
                <Car className="w-2.5 h-2.5 text-[#7C3AED]" /> Car
              </p>
              <p className="font-bold text-[#312E81]">₹{facility.rates.car}/h</p>
            </div>
            <div className={`border-x border-[#EDE9FE] ${highlightSection === 'bike' ? 'bg-[#EDE9FE] rounded-xl py-1' : ''}`}>
              <p className="text-[10px] text-[#6B7280] flex items-center justify-center gap-1 font-semibold">
                <Bike className="w-2.5 h-2.5 text-[#7C3AED]" /> Bike
              </p>
              <p className="font-bold text-[#312E81]">₹{facility.rates.bike}/h</p>
            </div>
            <div className={highlightSection === 'ev' ? 'bg-[#EDE9FE] rounded-xl py-1' : ''}>
              <p className="text-[10px] text-[#6B7280] flex items-center justify-center gap-1 font-semibold">
                <Zap className="w-2.5 h-2.5 text-[#7C3AED]" /> EV Port
              </p>
              <p className="font-bold text-[#7C3AED]">₹{facility.rates.evPerKwh || 18}/kWh</p>
            </div>
          </div>

          {/* Amenities tags */}
          <div className="flex flex-wrap gap-1.5 my-2">
            {facility.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#F8F5FF] text-[#4B5563] border border-[#EDE9FE]"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
        <button
          onClick={() => onSelectFacility(facility)}
          className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-[#7C3AED]/20 transition-all cursor-pointer group-hover:shadow-md"
        >
          <span>
            {highlightSection === 'ev' ? 'View EV Chargers & Reserve' :
             highlightSection === 'bike' ? 'Reserve Two-Wheeler Slot' :
             'Select & Reserve Slot'}
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
