import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Clock, Car, Zap, CheckCircle2, AlertCircle, ArrowRight, Bike } from 'lucide-react';
import { ParkingFacility, ParkingSlot, VehicleType, Booking } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: ParkingFacility;
  slot: ParkingSlot;
  initialDurationHours?: number;
  initialVehicleType?: VehicleType;
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  facility,
  slot,
  initialDurationHours = 2,
  initialVehicleType = 'car',
  onBookingSuccess
}) => {
  const { user } = useAuth();
  const [durationHours, setDurationHours] = useState(initialDurationHours);
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialVehicleType);
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || 'TN-01-AB-1234');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'razorpay'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockExpiresIn, setLockExpiresIn] = useState(300); // 5 min countdown

  useEffect(() => {
    if (!isOpen) return;

    // Acquire concurrency lock on backend
    api.lockSlot(slot.id).catch(err => {
      setErrorMessage(err.message || 'Could not acquire lock for this slot.');
    });

    const timer = setInterval(() => {
      setLockExpiresIn(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      api.releaseSlotLock(slot.id).catch(() => {});
    };
  }, [isOpen, slot.id]);

  if (!isOpen) return null;

  const ratePerHour = slot.pricePerHour;
  const totalAmount = ratePerHour * durationHours;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleConfirmReservation = async () => {
    if (!vehicleNumber.trim()) {
      setErrorMessage('Please enter your vehicle license plate number.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const now = new Date();
      const startTime = now.toISOString();
      const endTime = new Date(now.getTime() + durationHours * 3600000).toISOString();

      let transactionId = `tx_${Date.now()}`;

      if (paymentMethod === 'razorpay') {
        const orderData = await api.createRazorpayOrder(totalAmount, `rec_${slot.slotNumber}`);
        transactionId = `pay_rzp_${Date.now()}`;

        await api.verifyRazorpayPayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: transactionId,
          razorpay_signature: 'signature_verified'
        });
      }

      // Create Booking with atomic lock release
      const res = await api.createBooking({
        facilityId: facility.id,
        slotId: slot.id,
        vehicleType,
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        startTime,
        endTime,
        durationHours,
        paymentMethod: paymentMethod === 'upi' ? 'demo' : 'razorpay',
        transactionId
      });

      // Launch celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onBookingSuccess(res.booking);
      onClose();
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to complete reservation.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#EDE9FE] shadow-2xl overflow-hidden text-[#312E81] my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#EDE9FE] flex items-center justify-between bg-[#F8F5FF]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">Step 2 of 2: Secure Reservation</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-bold">
                Lock held: {formatTime(lockExpiresIn)}
              </span>
            </div>
            <h3 className="text-lg font-black text-[#312E81] mt-1">
              Slot {slot.slotNumber} • {facility.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#312E81] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Error notice */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Slot Summary Card */}
          <div className="p-4 rounded-2xl bg-[#F8F5FF] border border-[#EDE9FE] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] border border-[#A78BFA]/30 flex items-center justify-center text-[#7C3AED] font-black text-lg">
                {slot.slotNumber}
              </div>
              <div>
                <p className="text-xs font-bold text-[#312E81]">Level: {slot.floor} Floor</p>
                <p className="text-[11px] text-[#6B7280]">{facility.landmark || facility.address}</p>
                {slot.hasEVCharger && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#7C3AED] font-bold mt-0.5">
                    <Zap className="w-3 h-3 fill-[#7C3AED]" /> EV Fast Charger (Up to 60kW)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6B7280]">Hourly Rate</p>
              <p className="text-base font-black text-[#7C3AED]">₹{ratePerHour}/hr</p>
            </div>
          </div>

          {/* Vehicle Configuration */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#312E81] uppercase tracking-wider">
              Vehicle Type & Registration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'car', label: 'Car', icon: Car },
                { id: 'ev', label: 'EV', icon: Zap },
                { id: 'suv', label: 'SUV', icon: Car },
                { id: 'bike', label: 'Bike', icon: Bike }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVehicleType(item.id as VehicleType)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    vehicleType === item.id
                      ? 'bg-[#EDE9FE] border-[#7C3AED] text-[#7C3AED] shadow-xs'
                      : 'bg-white border-[#EDE9FE] text-[#6B7280] hover:text-[#312E81]'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] text-[#6B7280] mb-1 font-semibold">Vehicle License Plate (India)</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. TN-01-AB-1234 or KA-01-MJ-4590"
                className="w-full bg-[#F8F5FF] border border-[#EDE9FE] rounded-xl px-3.5 py-2.5 text-xs text-[#312E81] uppercase font-mono tracking-wider focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          {/* Duration Slider */}
          <div className="space-y-2 p-4 rounded-2xl bg-[#F8F5FF] border border-[#EDE9FE]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#312E81] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#7C3AED]" /> Parking Duration:
              </span>
              <span className="font-black text-[#7C3AED] text-sm">
                {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={durationHours}
              onChange={e => setDurationHours(Number(e.target.value))}
              className="w-full accent-[#7C3AED] cursor-pointer h-2 bg-[#EDE9FE] rounded-lg"
            />

            <div className="flex justify-between text-[10px] text-[#6B7280] font-mono">
              <span>1 hr</span>
              <span>3 hrs</span>
              <span>6 hrs</span>
              <span>9 hrs</span>
              <span>12 hrs</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#312E81] uppercase tracking-wider">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-[#EDE9FE] border-[#7C3AED] text-[#312E81]'
                    : 'bg-white border-[#EDE9FE] text-[#6B7280] hover:border-[#A78BFA]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#7C3AED]">⚡ UPI / Instant Wallet</span>
                  {paymentMethod === 'upi' && <CheckCircle2 className="w-3.5 h-3.5 text-[#7C3AED]" />}
                </div>
                <p className="text-[10px] text-[#6B7280]">Pay instantly via Google Pay, PhonePe, or FASTag account.</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  paymentMethod === 'razorpay'
                    ? 'bg-[#EDE9FE] border-[#7C3AED] text-[#312E81]'
                    : 'bg-white border-[#EDE9FE] text-[#6B7280] hover:border-[#A78BFA]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#7C3AED]">💳 Cards & NetBanking</span>
                  {paymentMethod === 'razorpay' && <CheckCircle2 className="w-3.5 h-3.5 text-[#7C3AED]" />}
                </div>
                <p className="text-[10px] text-[#6B7280]">Credit, debit cards, and netbanking via secure payment gateway.</p>
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-3.5 rounded-2xl bg-[#F8F5FF] border border-[#EDE9FE] text-xs space-y-1.5">
            <div className="flex justify-between text-[#6B7280]">
              <span>Rate (₹{ratePerHour}/hr × {durationHours} hrs)</span>
              <span className="text-[#312E81] font-semibold">₹{totalAmount}</span>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>Platform Booking Fee (Waived)</span>
              <span className="text-emerald-600 font-bold">FREE</span>
            </div>
            <div className="pt-2 border-t border-[#EDE9FE] flex justify-between items-center text-sm font-black">
              <span className="text-[#312E81]">Total Amount</span>
              <span className="text-[#7C3AED] text-lg">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 border-t border-[#EDE9FE] bg-[#F8F5FF] flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#6B7280]">Guaranteed reservation</p>
            <p className="text-xs font-bold text-[#312E81]">Instant QR Pass Generated</p>
          </div>

          <button
            disabled={isProcessing || lockExpiresIn <= 0}
            onClick={handleConfirmReservation}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs transition-all shadow-md shadow-[#7C3AED]/25 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <span>Confirming Reservation...</span>
            ) : (
              <>
                <span>Pay ₹{totalAmount} & Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
