import React, { useState } from 'react';
import { ParkingFacility } from '../types/index.ts';
import { Compass, Zap, Navigation, ExternalLink } from 'lucide-react';

interface GoogleMapViewerProps {
  facilities: ParkingFacility[];
  selectedFacility: ParkingFacility | null;
  onSelectFacility: (facility: ParkingFacility) => void;
}

export const GoogleMapViewer: React.FC<GoogleMapViewerProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility
}) => {
  const [activeCity, setActiveCity] = useState<string>('All');

  const filteredFacilities = activeCity === 'All'
    ? facilities
    : facilities.filter(f => f.city.toLowerCase() === activeCity.toLowerCase());

  const currentFocus = selectedFacility || filteredFacilities[0] || facilities[0];

  return (
    <div className="bg-white rounded-3xl border border-[#EDE9FE] overflow-hidden shadow-xs text-[#312E81]">
      {/* Top Map Header & Controls */}
      <div className="p-4 bg-[#F8F5FF] border-b border-[#EDE9FE] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-[#312E81]">Smart Radar Map</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
                Geolocation Ready
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280]">Live facility geolocation & real-time slot telemetry</p>
          </div>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['All', 'Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad'].map(city => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeCity === city
                  ? 'bg-[#7C3AED] text-white font-bold shadow-xs'
                  : 'bg-white text-[#6B7280] hover:text-[#312E81] border border-[#EDE9FE]'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas Visual Area */}
      <div className="relative h-[480px] w-full bg-[#F8F5FF] overflow-hidden flex items-center justify-center">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#A78BFA 1px, transparent 1px), radial-gradient(#EDE9FE 1px, #F8F5FF 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }}
        />

        {/* Radar concentric range circles */}
        <div className="absolute w-[600px] h-[600px] rounded-full border border-[#A78BFA]/20 pointer-events-none animate-pulse" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-[#A78BFA]/30 pointer-events-none" />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-[#7C3AED]/25 pointer-events-none" />

        {/* Focus Coordinate Indicator */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#EDE9FE] text-[11px] flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[#312E81] font-mono font-medium">
            {currentFocus ? `${currentFocus.name} (${currentFocus.location.lat.toFixed(4)}° N, ${currentFocus.location.lng.toFixed(4)}° E)` : 'Tracking Facilities'}
          </span>
        </div>

        {/* Facilities Interactive Pins on the Map */}
        <div className="relative w-full h-full max-w-4xl p-8 flex items-center justify-around flex-wrap">
          {filteredFacilities.map(fac => {
            const isSelected = selectedFacility?.id === fac.id;
            return (
              <div
                key={fac.id}
                onClick={() => onSelectFacility(fac)}
                className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 m-4 ${
                  isSelected ? 'scale-105 z-20' : 'z-10'
                }`}
              >
                {/* Pin Card Tooltip */}
                <div
                  className={`p-3 rounded-2xl border transition-all shadow-md ${
                    isSelected
                      ? 'bg-white border-[#7C3AED] ring-4 ring-[#7C3AED]/20 text-[#312E81]'
                      : 'bg-white border-[#EDE9FE] hover:border-[#A78BFA] text-[#312E81]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs bg-[#EDE9FE] text-[#7C3AED]">
                      {fac.availableSlots}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight line-clamp-1">{fac.name}</h4>
                      <p className="text-[10px] text-[#6B7280] flex items-center gap-1">
                        <span>{fac.city}</span> • <span className="text-[#7C3AED] font-bold">₹{fac.rates.car}/hr</span>
                      </p>
                    </div>
                  </div>

                  {fac.evChargingAvailable && (
                    <div className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-[#7C3AED] bg-[#EDE9FE] px-1.5 py-0.5 rounded-md">
                      <Zap className="w-2.5 h-2.5 fill-[#7C3AED]" /> Fast EV Ports Ready
                    </div>
                  )}
                </div>

                {/* Pin Marker stem */}
                <div className="w-3 h-3 bg-[#7C3AED] rotate-45 mx-auto -mt-1.5 rounded-sm shadow-sm" />
              </div>
            );
          })}
        </div>

        {/* Selected Facility Inspector Quick Panel */}
        {currentFocus && (
          <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-md rounded-2xl border border-[#EDE9FE] p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={currentFocus.imageUrl}
                alt={currentFocus.name}
                className="w-16 h-16 rounded-xl object-cover border border-[#EDE9FE]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-[#312E81]">{currentFocus.name}</h4>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#EDE9FE] text-[#7C3AED]">
                    {currentFocus.availableSlots} Slots Free
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">{currentFocus.address}</p>
                <div className="flex items-center gap-3 text-[11px] text-[#4B5563] mt-1">
                  <span>Car: <strong className="text-[#312E81]">₹{currentFocus.rates.car}/h</strong></span>
                  <span>Bike: <strong className="text-[#312E81]">₹{currentFocus.rates.bike}/h</strong></span>
                  <span>Hours: <strong className="text-[#312E81]">{currentFocus.operatingHours}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`https://maps.google.com/?q=${currentFocus.location.lat},${currentFocus.location.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F8F5FF] hover:bg-[#EDE9FE] text-[#312E81] text-xs font-semibold rounded-xl border border-[#EDE9FE] transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Navigate</span>
                <ExternalLink className="w-3 h-3 text-[#6B7280]" />
              </a>
              <button
                onClick={() => onSelectFacility(currentFocus)}
                className="flex-1 sm:flex-initial px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#7C3AED]/20 active:scale-95 cursor-pointer"
              >
                View Parking Bays & Book
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
