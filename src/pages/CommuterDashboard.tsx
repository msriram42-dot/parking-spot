import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, MapPin, Zap, Filter, Compass, QrCode, ArrowRight, Bike, Car, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { ParkingFacility, Booking, VehicleType, ServiceSection } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { FacilityCard } from '../components/FacilityCard.tsx';
import { GoogleMapViewer } from '../components/GoogleMapViewer.tsx';

interface CommuterDashboardProps {
  onOpenParkBot: () => void;
  onSelectFacility: (facility: ParkingFacility) => void;
  onOpenTicketPass: (booking: Booking) => void;
  onSelectSlotFromBot?: (facilityId: string, slotId: string, duration: number, vType: VehicleType) => void;
  currentSection: ServiceSection;
  onSelectSection: (section: ServiceSection) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const CommuterDashboard: React.FC<CommuterDashboardProps> = ({
  onOpenParkBot,
  onSelectFacility,
  onOpenTicketPass,
  currentSection,
  onSelectSection,
  selectedCity,
  setSelectedCity,
  selectedArea,
  setSelectedArea,
  searchQuery,
  setSearchQuery
}) => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);
  const facilitiesRequestId = useRef(0);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [minRating, setMinRating] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'area' | 'facility' | 'city' | 'service';
    title: string;
    subtitle: string;
    city?: string;
    area?: string;
    facilityId?: string;
    serviceType?: 'car' | 'ev' | 'bike';
  }>>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Chennai areas list as specified
  const chennaiAreas = ['Anna Nagar', 'T. Nagar', 'Velachery', 'Tambaram', 'OMR'];

  // Public facility discovery must never depend on a protected booking-history request.
  const fetchFacilitiesAndBookings = async () => {
    const requestId = ++facilitiesRequestId.current;
    setLoading(true);
    setFacilitiesError(null);
    try {
      const facRes = await api.getFacilities({
        city: selectedCity,
        area: selectedArea !== 'All' ? selectedArea : undefined,
        search: searchQuery,
        serviceType: currentSection,
        maxPrice: maxPrice < 100 ? maxPrice : undefined,
        minRating: minRating > 0 ? minRating : undefined
      });
      // Prevent a slower response for an older filter from replacing current results.
      if (requestId === facilitiesRequestId.current) {
        setFacilities(facRes.facilities);
      }
    } catch (err) {
      if (requestId === facilitiesRequestId.current) {
        console.error('Failed to load parking facilities', err);
        setFacilities([]);
        setFacilitiesError(err instanceof Error ? err.message : 'Unable to load parking facilities.');
      }
    } finally {
      if (requestId === facilitiesRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchFacilitiesAndBookings(); }, 250);
    return () => { window.clearTimeout(timer); facilitiesRequestId.current += 1; };
  }, [selectedCity, selectedArea, searchQuery, currentSection, maxPrice, minRating]);

  // Booking history is private; only load it after successful authentication.
  useEffect(() => {
    if (!user) { setMyBookings([]); return; }
    let cancelled = false;
    api.getMyBookings()
      .then(data => { if (!cancelled) setMyBookings(data.bookings); })
      .catch(err => { if (!cancelled) { console.error('Failed to load bookings', err); setMyBookings([]); } });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Handle Autocomplete fetch
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions([]);
      setIsAutocompleteOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.getAutocomplete(searchQuery);
        setSuggestions(res.suggestions || []);
        setIsAutocompleteOpen(res.suggestions && res.suggestions.length > 0);
      } catch (e) {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAutocompleteOpen(false);
    fetchFacilitiesAndBookings();
  };

  const handleSelectSuggestion = (s: typeof suggestions[0]) => {
    setIsAutocompleteOpen(false);
    if (s.city) setSelectedCity(s.city);
    if (s.area) setSelectedArea(s.area);
    if (s.serviceType) onSelectSection(s.serviceType);

    if (s.facilityId) {
      const found = facilities.find(f => f.id === s.facilityId);
      if (found) {
        onSelectFacility(found);
        return;
      }
    }
    setSearchQuery(s.title);
    // Changing the search/filter state triggers the debounced facility request.
  };

  const handleResetFilters = () => {
    setSelectedCity('All');
    setSelectedArea('All');
    setSearchQuery('');
    onSelectSection('all');
    setMaxPrice(100);
    setMinRating(0);
  };

  const activePasses = myBookings.filter(b => b.status === 'confirmed' || b.status === 'active');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-[#312E81]">
      
      {/* Hero Search & Section Banner (Lavender Gradient) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#EDE9FE] via-[#F8F5FF] to-[#EDE9FE] border border-[#EDE9FE] p-6 sm:p-10 shadow-xs">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EDE9FE] text-[#7C3AED] text-xs font-bold mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Urban Parking Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#312E81] tracking-tight leading-tight">
            Reserve parking spaces ahead. <br className="hidden sm:block" />
            <span className="text-[#7C3AED]">
              {currentSection === 'ev' ? 'Fast EV Charging Stations' :
               currentSection === 'bike' ? 'Dedicated Two-Wheeler Bays' :
               'Zero circle driving, zero stress.'}
            </span>
          </h1>

          <p className="text-[#4B5563] text-xs sm:text-sm mt-2 max-w-xl leading-relaxed font-medium">
            Real-time slot synchronization, verified EV charging plugs, and automated QR parking passes across Chennai (Anna Nagar, T. Nagar, Velachery, Tambaram, OMR), Bangalore, Mumbai, Delhi, and Hyderabad.
          </p>

          {/* Interactive Search Bar with Autocomplete */}
          <div className="relative mt-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl border border-[#EDE9FE] shadow-lg shadow-[#7C3AED]/5">
              
              {/* City Selector */}
              <div className="flex items-center gap-1 sm:border-r border-[#EDE9FE] pr-2">
                <MapPin className="w-4 h-4 text-[#7C3AED] ml-2" />
                <select
                  value={selectedCity}
                  onChange={e => {
                    setSelectedCity(e.target.value);
                    setSelectedArea('All');
                  }}
                  className="bg-transparent border-none rounded-xl px-2 py-2 text-xs font-bold text-[#312E81] outline-none cursor-pointer"
                >
                  <option value="All">All Cities</option>
                  <option value="Chennai">Chennai (Tamil Nadu)</option>
                  <option value="Bangalore">Bangalore (Karnataka)</option>
                  <option value="Mumbai">Mumbai (Maharashtra)</option>
                  <option value="Delhi">Delhi NCR</option>
                  <option value="Hyderabad">Hyderabad (Telangana)</option>
                </select>
              </div>

              {/* Service Section Dropdown */}
              <div className="flex items-center gap-1 sm:border-r border-[#EDE9FE] pr-2">
                <select
                  value={currentSection}
                  onChange={e => onSelectSection(e.target.value as ServiceSection)}
                  className="bg-transparent border-none rounded-xl px-2 py-2 text-xs font-bold text-[#7C3AED] outline-none cursor-pointer"
                >
                  <option value="all">All Services</option>
                  <option value="car">🚗 Car Parking</option>
                  <option value="ev">⚡ EV Fast Charging</option>
                  <option value="bike">🏍️ Bike Parking</option>
                </select>
              </div>

              {/* Search text input */}
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setIsAutocompleteOpen(true); }}
                  placeholder="Search city, area, landmark, metro station..."
                  className="w-full bg-transparent pl-9 pr-8 py-2 text-xs text-[#312E81] placeholder-[#9CA3AF] outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setIsAutocompleteOpen(false); }}
                    className="p-1 text-[#9CA3AF] hover:text-[#312E81] mr-2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    showFilters ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-[#F8F5FF] text-[#4B5563] border-[#EDE9FE] hover:text-[#312E81]'
                  }`}
                  title="Filter options"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-md shadow-[#7C3AED]/20 cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {isAutocompleteOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#EDE9FE] rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in-50 duration-150">
                <div className="p-2.5 border-b border-[#EDE9FE] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider flex justify-between items-center bg-[#F8F5FF]">
                  <span>Smart Search Suggestions</span>
                  <span className="text-[10px] text-[#9CA3AF]">Press enter to query</span>
                </div>
                <div className="divide-y divide-[#EDE9FE] max-h-80 overflow-y-auto">
                  {suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSuggestion(s)}
                      className="p-3 hover:bg-[#F8F5FF] cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          s.type === 'area' ? 'bg-[#EDE9FE] text-[#7C3AED]' :
                          s.type === 'service' ? 'bg-[#EDE9FE] text-[#7C3AED]' :
                          s.type === 'city' ? 'bg-[#EDE9FE] text-[#7C3AED]' :
                          'bg-[#EDE9FE] text-[#312E81]'
                        }`}>
                          {s.type === 'area' ? <MapPin className="w-4 h-4" /> :
                           s.type === 'service' ? <Zap className="w-4 h-4" /> :
                           s.type === 'city' ? <Compass className="w-4 h-4" /> :
                           <Car className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#312E81] group-hover:text-[#7C3AED] transition-colors">
                            {s.title}
                          </p>
                          <p className="text-[11px] text-[#6B7280]">{s.subtitle}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Filters Drawer */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-2xl bg-white border border-[#EDE9FE] shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                    Max Price: ₹{maxPrice}/hr
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-32 accent-[#7C3AED] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                    Min Rating: {minRating > 0 ? `${minRating}★` : 'Any'}
                  </label>
                  <select
                    value={minRating}
                    onChange={e => setMinRating(Number(e.target.value))}
                    className="bg-[#F8F5FF] border border-[#EDE9FE] rounded-lg px-2.5 py-1 text-[#312E81] text-xs outline-none font-medium"
                  >
                    <option value="0">All Ratings</option>
                    <option value="4.5">4.5★ and above</option>
                    <option value="4.8">4.8★ only</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg bg-[#F8F5FF] hover:bg-[#EDE9FE] text-[#312E81] text-xs font-semibold cursor-pointer border border-[#EDE9FE]"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Chennai Specific Quick Area Badges */}
          {selectedCity === 'Chennai' && (
            <div className="mt-4 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider mr-1">
                Chennai Zones:
              </span>
              <button
                onClick={() => setSelectedArea('All')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedArea === 'All'
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'bg-white text-[#4B5563] hover:text-[#312E81] border border-[#EDE9FE]'
                }`}
              >
                All Chennai ({facilities.length})
              </button>
              {chennaiAreas.map(area => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedArea === area
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'bg-white text-[#4B5563] hover:text-[#312E81] border border-[#EDE9FE]'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Booking QR Passes notification banner for commuter */}
      {activePasses.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EDE9FE] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] border border-[#A78BFA]/30 flex items-center justify-center text-[#7C3AED] shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">Active Digital Pass</span>
                <span className="font-mono text-xs font-black text-[#312E81] px-2 py-0.5 rounded-lg bg-[#EDE9FE]">
                  {activePasses[0].bookingCode}
                </span>
              </div>
              <p className="text-sm font-bold text-[#312E81] mt-0.5">
                {activePasses[0].facilityName} • Slot {activePasses[0].slotNumber}
              </p>
              <p className="text-xs text-[#6B7280]">
                Plate: {activePasses[0].vehicleNumber} • Valid until {new Date(activePasses[0].endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenTicketPass(activePasses[0])}
            className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#7C3AED]/20 transition-all cursor-pointer"
          >
            <span>View Scannable QR Pass</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dedicated Section Specific Header Info */}
      {currentSection === 'ev' && (
        <div className="p-5 rounded-3xl bg-white border border-[#EDE9FE] shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#EDE9FE] text-[#7C3AED]">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#312E81]">EV Charging Superhubs & Fast Ports</h2>
                <p className="text-xs text-[#6B7280]">
                  Dual-gun CCS2 60kW/120kW DC fast chargers & Type 2 AC ports across Chennai, Bangalore, and Mumbai.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE] text-[#7C3AED] font-bold">
                CCS2 (60kW DC)
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE] text-[#7C3AED] font-bold">
                Type 2 (22kW AC)
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE] text-[#7C3AED] font-bold">
                Avg ₹18/kWh
              </span>
            </div>
          </div>
        </div>
      )}

      {currentSection === 'bike' && (
        <div className="p-5 rounded-3xl bg-white border border-[#EDE9FE] shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#EDE9FE] text-[#7C3AED]">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#312E81]">Dedicated Two-Wheeler & Scooter Bays</h2>
                <p className="text-xs text-[#6B7280]">
                  Affordable covered bays starting at ₹15/hr with safe helmet lockers, CCTV coverage, and easy barrier scan.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE] text-[#7C3AED] font-bold">
                🔒 Helmet Lockers
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE] text-[#7C3AED] font-bold">
                🛡️ CCTV 24/7
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#F8F5FF] border border-[#EDE9FE] text-[#7C3AED] font-bold">
                ₹15 - ₹20/hr
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Facilities Section Header & View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#312E81] flex items-center gap-2">
            <span>
              {currentSection === 'ev' ? 'Available EV Charging Stations' :
               currentSection === 'bike' ? 'Available Two-Wheeler Hubs' :
               currentSection === 'car' ? 'Car & SUV Parking Bays' :
               'Verified Parking & Charging Facilities'}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
              {facilities.length} Found
            </span>
          </h2>
          <p className="text-xs text-[#6B7280]">
            {selectedCity !== 'All' ? `Showing facilities in ${selectedCity}${selectedArea !== 'All' ? ` (${selectedArea})` : ''}` : 'Showing all verified hubs across India'}
          </p>
        </div>

        {/* View Toggle (Grid vs Radar Map) */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-[#EDE9FE] shadow-xs">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#312E81]'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#312E81]'
            }`}
          >
            Radar Map
          </button>
        </div>
      </div>

      {/* Facility Grid or Map */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-96 rounded-3xl bg-white animate-pulse border border-[#EDE9FE]" />
          ))}
        </div>
      ) : facilitiesError ? (
        <div role="alert" className="text-center py-14 rounded-3xl bg-white border border-rose-200 p-8 space-y-4">
          <h3 className="text-lg font-bold text-rose-800">Could not load parking facilities</h3>
          <p className="text-sm text-rose-700">{facilitiesError}</p>
          <p className="text-xs text-gray-500">Check that the backend is running and VITE_API_ORIGIN points to its public URL.</p>
          <button onClick={() => void fetchFacilitiesAndBookings()} className="px-5 py-2 rounded-xl bg-violet-700 text-white font-bold">Try Again</button>
        </div>
      ) : viewMode === 'map' ? (
        <GoogleMapViewer
          facilities={facilities}
          onSelectFacility={onSelectFacility}
          selectedFacility={null}
        />
      ) : facilities.length === 0 ? (
        /* Empty State Feedback */
        <div className="text-center py-16 bg-white rounded-3xl border border-[#EDE9FE] p-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] flex items-center justify-center mx-auto text-[#7C3AED]">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#312E81]">No parking facilities match your search</h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            We couldn't find any spots matching "{searchQuery}" in {selectedCity} {selectedArea !== 'All' ? `(${selectedArea})` : ''} for the "{currentSection}" category.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-md shadow-[#7C3AED]/20 cursor-pointer"
            >
              Reset Filters & Show All
            </button>
            <button
              onClick={onOpenParkBot}
              className="px-4 py-2 rounded-xl bg-[#F8F5FF] hover:bg-[#EDE9FE] text-[#7C3AED] text-xs font-bold transition-all border border-[#EDE9FE] cursor-pointer"
            >
              Ask ParkBot for Alternative
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map(facility => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onSelectFacility={onSelectFacility}
              highlightSection={currentSection}
            />
          ))}
        </div>
      )}
    </div>
  );
};
