import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { ParkBotDrawer } from './components/ParkBotDrawer.tsx';
import { QRCodeModal } from './components/QRCodeModal.tsx';
import { QRScannerModal } from './components/QRScannerModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';

import { CommuterDashboard } from './pages/CommuterDashboard.tsx';
import { FacilityDetailView } from './pages/FacilityDetailView.tsx';
import { OwnerDashboard } from './pages/OwnerDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { ParkingFacility, Booking, VehicleType, ServiceSection } from './types/index.ts';
import { api } from './services/api.ts';

interface NavigationHistoryState {
  facilityId: string | null;
  city: string;
  area: string;
  section: ServiceSection;
  query: string;
  role: string;
}

const AppContent: React.FC = () => {
  const { user } = useAuth();

  // Search & Filter State preserved across views (Requirement 1 & 4)
  const [selectedCity, setSelectedCity] = useState<string>('Chennai');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [currentSection, setCurrentSection] = useState<ServiceSection>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<ParkingFacility | null>(null);

  // Modals
  const [isParkBotOpen, setIsParkBotOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'admin' | 'forgot'>('login');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activePassToView, setActivePassToView] = useState<Booking | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Bot Pre-selection
  const [botSelectedSlotId, setBotSelectedSlotId] = useState<string | null>(null);
  const [botDurationHours, setBotDurationHours] = useState<number>(2);
  const [botVehicleType, setBotVehicleType] = useState<VehicleType>('car');

  // Push State to Browser History (Requirement 1)
  const pushNavState = useCallback((params: {
    facility?: ParkingFacility | null;
    city?: string;
    area?: string;
    section?: ServiceSection;
    query?: string;
  }) => {
    const newState: NavigationHistoryState = {
      facilityId: params.facility ? params.facility.id : (params.facility === null ? null : selectedFacility?.id || null),
      city: params.city !== undefined ? params.city : selectedCity,
      area: params.area !== undefined ? params.area : selectedArea,
      section: params.section !== undefined ? params.section : currentSection,
      query: params.query !== undefined ? params.query : searchQuery,
      role: user?.role || 'commuter'
    };

    try {
      const url = new URL(window.location.href);
      if (newState.facilityId) url.searchParams.set('facility', newState.facilityId);
      else url.searchParams.delete('facility');
      if (newState.city) url.searchParams.set('city', newState.city);
      if (newState.area && newState.area !== 'All') url.searchParams.set('area', newState.area);
      else url.searchParams.delete('area');
      if (newState.section && newState.section !== 'all') url.searchParams.set('section', newState.section);
      else url.searchParams.delete('section');

      window.history.pushState(newState, '', url.toString());
    } catch (e) {
      // ignore history errors in sandboxed iframes
    }
  }, [selectedFacility, selectedCity, selectedArea, currentSection, searchQuery, user?.role]);

  // Handle Browser Back / Forward buttons (Requirement 1)
  useEffect(() => {
    const handlePopState = async (event: PopStateEvent) => {
      const state = event.state as NavigationHistoryState | null;
      if (state) {
        if (state.city) setSelectedCity(state.city);
        if (state.area) setSelectedArea(state.area);
        if (state.section) setCurrentSection(state.section);
        if (state.query !== undefined) setSearchQuery(state.query);

        if (state.facilityId) {
          try {
            const res = await api.getFacility(state.facilityId);
            setSelectedFacility(res.facility);
          } catch (e) {
            setSelectedFacility(null);
          }
        } else {
          setSelectedFacility(null);
        }
      } else {
        setSelectedFacility(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Visible Back Button Action
  const handleGoBack = () => {
    if (selectedFacility) {
      setSelectedFacility(null);
      setBotSelectedSlotId(null);
      pushNavState({ facility: null });
    } else if (currentSection !== 'all') {
      setCurrentSection('all');
      pushNavState({ section: 'all' });
    } else if (selectedArea !== 'All') {
      setSelectedArea('All');
      pushNavState({ area: 'All' });
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  // Visible Home Button Action
  const handleGoHome = () => {
    setSelectedFacility(null);
    setBotSelectedSlotId(null);
    setCurrentSection('all');
    pushNavState({ facility: null, section: 'all' });
  };

  // Handle facility selection with history update
  const handleSelectFacility = (fac: ParkingFacility) => {
    setSelectedFacility(fac);
    setBotSelectedSlotId(null);
    pushNavState({ facility: fac });
  };

  // Handle Section selection with history update
  const handleSelectSection = (section: ServiceSection) => {
    setCurrentSection(section);
    if (selectedFacility) setSelectedFacility(null);
    pushNavState({ section, facility: null });
  };

  // Handle commuter choosing a slot directly from AI ParkBot recommendations
  const handleSelectSlotFromParkBot = async (
    facilityId: string,
    slotId: string,
    durationHours: number,
    vehicleType: VehicleType
  ) => {
    try {
      const res = await api.getFacility(facilityId);
      setSelectedFacility(res.facility);
      setBotSelectedSlotId(slotId);
      setBotDurationHours(durationHours);
      setBotVehicleType(vehicleType);
      pushNavState({ facility: res.facility });
    } catch (err) {
      console.error('Failed to open facility from ParkBot', err);
    }
  };

  const handleOpenMyPasses = async () => {
    if (!user) {
      handleOpenAuthModal('login');
      return;
    }
    try {
      const res = await api.getMyBookings();
      const active = res.bookings.find(b => b.status === 'confirmed' || b.status === 'active') || res.bookings[0];
      if (active) {
        setActivePassToView(active);
        setIsPassModalOpen(true);
      } else {
        alert('No active parking passes found. Book a parking space to generate your QR pass!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.cancelBooking(bookingId);
      setIsPassModalOpen(false);
      setActivePassToView(null);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleOpenAuthModal = (mode: 'login' | 'register' | 'admin' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const canGoBack = Boolean(selectedFacility || currentSection !== 'all' || selectedArea !== 'All');

  return (
    <div className="min-h-screen bg-[#F8F5FF] text-[#312E81] flex flex-col selection:bg-[#EDE9FE] selection:text-[#7C3AED]">
      
      {/* Top Navigation Bar with Back & Home and Section Bar */}
      <Navbar
        onOpenParkBot={() => setIsParkBotOpen(true)}
        onOpenMyPasses={handleOpenMyPasses}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        onGoHome={handleGoHome}
      />

      {/* Main Role-Based View Switcher */}
      <main className="flex-1 pb-16">
        {(!user || user.role === 'commuter') && (
          selectedFacility ? (
            <FacilityDetailView
              facility={selectedFacility}
              onBack={handleGoBack}
              onHome={handleGoHome}
              preSelectedSlotId={botSelectedSlotId}
              initialDurationHours={botDurationHours}
              initialVehicleType={botVehicleType}
              initialSection={currentSection}
            />
          ) : (
            <CommuterDashboard
              onOpenParkBot={() => setIsParkBotOpen(true)}
              onSelectFacility={handleSelectFacility}
              onOpenTicketPass={pass => {
                setActivePassToView(pass);
                setIsPassModalOpen(true);
              }}
              currentSection={currentSection}
              onSelectSection={handleSelectSection}
              selectedCity={selectedCity}
              setSelectedCity={city => {
                setSelectedCity(city);
                pushNavState({ city, area: 'All' });
              }}
              selectedArea={selectedArea}
              setSelectedArea={area => {
                setSelectedArea(area);
                pushNavState({ area });
              }}
              searchQuery={searchQuery}
              setSearchQuery={q => {
                setSearchQuery(q);
              }}
            />
          )
        )}

        {user?.role === 'owner' && (
          <OwnerDashboard
            onBack={handleGoBack}
            onHome={handleGoHome}
          />
        )}

        {user?.role === 'admin' && (
          <AdminDashboard
            onBack={handleGoBack}
            onHome={handleGoHome}
          />
        )}
      </main>

      {/* Global AI ParkBot Concierge Drawer */}
      <ParkBotDrawer
        isOpen={isParkBotOpen}
        onClose={() => setIsParkBotOpen(false)}
        onSelectSlotToBook={handleSelectSlotFromParkBot}
      />

      {/* Digital QR Pass Ticket Modal */}
      <QRCodeModal
        booking={activePassToView}
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        onCancelBooking={handleCancelBooking}
      />

      {/* Owner QR Scanner Terminal Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Authentication Modal with User & Admin Portal support */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
