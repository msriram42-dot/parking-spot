import React from 'react';
import { Sparkles, Car, Shield, Building2, UserCircle, QrCode, LogOut, ArrowLeft, Home, Zap, Bike, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { ServiceSection } from '../types/index.ts';

interface NavbarProps {
  onOpenParkBot: () => void;
  onOpenMyPasses: () => void;
  onOpenScanner?: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register' | 'forgot' | 'admin') => void;
  currentSection: ServiceSection;
  onSelectSection: (section: ServiceSection) => void;
  canGoBack: boolean;
  onGoBack: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenParkBot,
  onOpenMyPasses,
  onOpenScanner,
  onOpenAuthModal,
  currentSection,
  onSelectSection,
  canGoBack,
  onGoBack,
  onGoHome,
}) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EDE9FE] text-[#312E81] shadow-xs">
      {/* Top Bar with Brand, Navigation (Home / Back), and Auth Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Visible Back & Home Buttons + Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Always visible Back Button */}
            <button
              onClick={onGoBack}
              title="Go Back (Preserves search & filters)"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                canGoBack
                  ? 'bg-white hover:bg-[#EDE9FE] border-[#EDE9FE] text-[#312E81] active:scale-95 shadow-xs'
                  : 'bg-[#F8F5FF] border-[#EDE9FE]/50 text-[#9CA3AF] hover:text-[#312E81]'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-[#7C3AED]" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Always visible Home Button */}
            <button
              onClick={onGoHome}
              title="Return to Main Dashboard"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EDE9FE] border border-[#EDE9FE] text-[#312E81] text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <Home className="w-4 h-4 text-[#7C3AED]" />
              <span className="hidden sm:inline">Home</span>
            </button>

            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer ml-1" onClick={onGoHome}>
              <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] flex items-center justify-center shadow-md shadow-[#7C3AED]/20">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-[#312E81]">
                    ParkingSpot
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action & Authentication Controls */}
          <div className="flex items-center gap-2">
            {/* ParkBot AI Button */}
            <button
              onClick={onOpenParkBot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#7C3AED] border border-[#A78BFA]/40 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              <span className="hidden sm:inline">Ask ParkBot</span>
            </button>

            {/* Commuter: My Passes */}
            {user?.role === 'commuter' && (
              <button
                onClick={onOpenMyPasses}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8F5FF] text-[#312E81] text-xs font-semibold border border-[#EDE9FE] transition-all cursor-pointer shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="hidden sm:inline">My Passes</span>
              </button>
            )}

            {/* Owner: QR Ticket Scanner */}
            {user?.role === 'owner' && onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#7C3AED] text-xs font-semibold border border-[#A78BFA]/40 transition-all cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="hidden sm:inline">Scanner</span>
              </button>
            )}

            {/* Dedicated Admin Portal access button */}
            <button
              onClick={() => onOpenAuthModal('admin')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                user?.role === 'admin'
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm'
                  : 'bg-white text-[#7C3AED] hover:bg-[#EDE9FE] border-[#EDE9FE]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Admin Portal</span>
            </button>

            {/* User Profile or Visible Login / Register Buttons */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#EDE9FE]">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-[#312E81] truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[10px] text-[#7C3AED] uppercase font-bold tracking-wider">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out (Clear Session)"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-rose-50 text-[#6B7280] hover:text-rose-600 border border-[#EDE9FE] transition-all cursor-pointer text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-1 border-l border-[#EDE9FE]">
                {/* Visible Login Button (Section 1 requirement) */}
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-md shadow-[#7C3AED]/20 cursor-pointer active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>

                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8F5FF] text-[#312E81] text-xs font-bold border border-[#EDE9FE] transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Separate Sections Navigation Strip (EV Charging, Car Parking, Bike Parking) */}
      <div className="border-t border-[#EDE9FE] bg-[#F8F5FF] px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2 scrollbar-none">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider hidden sm:inline mr-1">
              Vehicle Services:
            </span>

            <button
              onClick={() => onSelectSection('all')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentSection === 'all'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white text-[#6B7280] hover:text-[#312E81] border border-[#EDE9FE]'
              }`}
            >
              All Hubs
            </button>

            <button
              onClick={() => onSelectSection('car')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentSection === 'car'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white text-[#312E81] hover:bg-[#EDE9FE] border border-[#EDE9FE]'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Car Parking</span>
            </button>

            <button
              onClick={() => onSelectSection('ev')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentSection === 'ev'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white text-[#312E81] hover:bg-[#EDE9FE] border border-[#EDE9FE]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>EV Fast Charging</span>
            </button>

            <button
              onClick={() => onSelectSection('bike')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentSection === 'bike'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white text-[#312E81] hover:bg-[#EDE9FE] border border-[#EDE9FE]'
              }`}
            >
              <Bike className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Bike Parking</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-[#7C3AED]">
            <span>Chennai • Bangalore • Mumbai • Delhi • Hyderabad</span>
          </div>
        </div>
      </div>
    </header>
  );
};
