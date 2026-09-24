import React, { useState } from 'react';
import { X, QrCode, Scan, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.ts';
import { Booking } from '../types/index.ts';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete?: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete
}) => {
  const [code, setCode] = useState('');
  const [action, setAction] = useState<'check-in' | 'check-out'>('check-in');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ booking: Booking; message: string } | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || code;
    if (!finalCode.trim()) {
      setError('Please provide a booking code or QR token');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.verifyQRCode(finalCode, action);
      setResult(res);
      if (onVerificationComplete) onVerificationComplete();
    } catch (err) {
      setError((err as Error).message || 'Failed to verify ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#EDE9FE] shadow-2xl overflow-hidden text-[#312E81] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-[#F8F5FF] border-b border-[#EDE9FE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#312E81]">Owner QR Ticket Terminal</h3>
              <p className="text-[10px] text-[#6B7280]">Automated Barrier & Guard Station Scanner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#312E81] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Action Switcher: Check-in vs Check-out */}
          <div className="flex bg-[#F8F5FF] p-1 rounded-2xl border border-[#EDE9FE]">
            <button
              onClick={() => setAction('check-in')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                action === 'check-in'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#312E81]'
              }`}
            >
              Entry Barrier (Check-In)
            </button>
            <button
              onClick={() => setAction('check-out')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                action === 'check-out'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#312E81]'
              }`}
            >
              Exit Barrier (Check-Out)
            </button>
          </div>

          {/* Scanner Viewfinder Visual Simulator */}
          <div className="relative h-44 bg-[#F8F5FF] rounded-2xl border-2 border-[#EDE9FE] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-x-8 top-6 bottom-6 border-2 border-dashed border-[#A78BFA] rounded-xl pointer-events-none" />
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
            
            <QrCode className="w-16 h-16 text-[#A78BFA]/50 mb-2" />
            <p className="text-xs text-[#7C3AED] font-mono font-semibold">
              Ready to verify live commuter pass
            </p>
            <p className="text-[10px] text-[#6B7280]">Scan optical code or enter digital ticket ID below</p>
          </div>

          {/* Code Input */}
          <div>
            <label className="block text-xs font-bold text-[#312E81] mb-1.5">
              Enter Booking Code or QR Token:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. PK-2026-4892"
                className="flex-1 bg-[#F8F5FF] border border-[#EDE9FE] rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-wider text-[#312E81] uppercase focus:outline-none focus:border-[#7C3AED]"
              />
              <button
                onClick={() => handleVerify()}
                disabled={isLoading || !code.trim()}
                className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#7C3AED]/20 active:scale-95 cursor-pointer"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Successful Verification Result Box */}
          {result && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Ticket Validated Successfully!</span>
              </div>

              <p className="text-xs text-emerald-700 font-medium">{result.message}</p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200">
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-[#6B7280]">Driver</span>
                  <p className="font-bold text-[#312E81]">{result.booking.userName}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-[#6B7280]">Slot Assigned</span>
                  <p className="font-extrabold text-[#7C3AED]">{result.booking.slotNumber}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-[#6B7280]">Vehicle Number</span>
                  <p className="font-mono font-bold text-[#312E81]">{result.booking.vehicleNumber}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-[#6B7280]">Updated State</span>
                  <p className="font-bold text-emerald-700 uppercase">{result.booking.status}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EDE9FE] bg-[#F8F5FF] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-[#EDE9FE] text-[#312E81] text-xs font-semibold border border-[#EDE9FE] transition-colors cursor-pointer"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
};
