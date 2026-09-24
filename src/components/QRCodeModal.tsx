import React from 'react';
import { X, Download, Printer, MapPin, Calendar, Clock, Car, ShieldCheck } from 'lucide-react';
import { Booking } from '../types/index.ts';

interface QRCodeModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelBooking?: (bookingId: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  booking,
  isOpen,
  onClose,
  onCancelBooking
}) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!booking.qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = booking.qrCodeDataUrl;
    link.download = `ParkingSpot_${booking.bookingCode}.png`;
    link.click();
  };

  const startTimeFormatted = new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeFormatted = new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const startDateFormatted = new Date(booking.startTime).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#EDE9FE] shadow-2xl overflow-hidden text-[#312E81] my-8 print:border-none print:shadow-none print:text-black print:bg-white animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-[#7C3AED] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <h3 className="font-extrabold text-sm tracking-wide uppercase">Official Digital Parking Pass</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-5">
          {/* Facility & Code */}
          <div className="text-center">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#7C3AED] bg-[#EDE9FE] px-3 py-1 rounded-full">
              {booking.bookingCode}
            </span>
            <h2 className="text-xl font-black text-[#312E81] mt-2">{booking.facilityName}</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">{booking.facilityAddress}</p>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-[#EDE9FE] shadow-sm">
            {booking.qrCodeDataUrl ? (
              <img
                src={booking.qrCodeDataUrl}
                alt="Parking QR Code"
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 bg-[#F8F5FF] flex items-center justify-center text-xs text-[#6B7280]">
                Generating QR...
              </div>
            )}
            <p className="text-[11px] text-[#6B7280] mt-2 font-medium">Scan at barrier terminal upon arrival & exit</p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-[#F8F5FF] border border-[#EDE9FE]">
              <span className="text-[10px] text-[#6B7280] block font-semibold">Reserved Slot</span>
              <span className="text-base font-black text-[#7C3AED]">Slot {booking.slotNumber}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8F5FF] border border-[#EDE9FE]">
              <span className="text-[10px] text-[#6B7280] block font-semibold">Vehicle Plate</span>
              <span className="text-sm font-mono font-bold text-[#312E81]">{booking.vehicleNumber}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8F5FF] border border-[#EDE9FE]">
              <span className="text-[10px] text-[#6B7280] block font-semibold">Valid Date</span>
              <span className="font-bold text-[#312E81]">{startDateFormatted}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8F5FF] border border-[#EDE9FE]">
              <span className="text-[10px] text-[#6B7280] block font-semibold">Time Window</span>
              <span className="font-bold text-[#312E81]">{startTimeFormatted} - {endTimeFormatted}</span>
            </div>
          </div>

          {/* Tariffs and status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#EDE9FE] text-xs font-bold text-[#312E81]">
            <span>Total Paid Amount:</span>
            <span className="text-sm text-[#7C3AED] font-black">₹{booking.totalAmount}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#EDE9FE] bg-[#F8F5FF] flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2.5 rounded-xl bg-white hover:bg-[#EDE9FE] text-[#312E81] text-xs font-bold flex items-center gap-1.5 border border-[#EDE9FE] cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#7C3AED]" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-white hover:bg-[#EDE9FE] text-[#312E81] text-xs font-bold flex items-center gap-1.5 border border-[#EDE9FE] cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#7C3AED]" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-md shadow-[#7C3AED]/20 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
