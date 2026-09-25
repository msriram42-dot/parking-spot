import React, { useState } from 'react';
import { X, Sparkles, Send, Zap, Clock, MapPin, ChevronRight, Car } from 'lucide-react';
import { api } from '../services/api.ts';
import { AIRecommendation, VehicleType } from '../types/index.ts';

interface ParkBotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSlotToBook: (facilityId: string, slotId: string, durationHours: number, vehicleType: VehicleType) => void;
}

export const ParkBotDrawer: React.FC<ParkBotDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSlotToBook
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCity, setActiveCity] = useState('All');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [chatHistory, setChatHistory] = useState<Array<{
    sender: 'user' | 'bot';
    text: string;
    extracted?: any;
    recommendations?: AIRecommendation[];
  }>>([
    {
      sender: 'bot',
      text: "👋 Hi! I'm ParkBot, your AI parking concierge. Tell me what you're looking for in plain English. For example:\n• \"Find cheap parking near Anna Nagar Chennai for 2 hours\"\n• \"Need EV charging near BKC Mumbai for my electric SUV\"\n• \"Best 24/7 covered parking near T. Nagar Chennai for a bike\""
    }
  ]);

  const quickPrompts = [
    'Cheap parking near Anna Nagar Chennai for 2 hours',
    'Best parking with EV charger in BKC Mumbai',
    'Bike parking near T. Nagar Chennai under ₹25/hr',
    'Covered parking near Velachery or OMR Chennai'
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    setInputQuery('');
    setChatHistory(prev => [...prev, { sender: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      const response = await api.askParkBot(textToSend, activeCity, vehicleType);
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'bot',
          text: response.message,
          extracted: response.extracted,
          recommendations: response.recommendations
        }
      ]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I couldn't complete that query right now: " + (err as Error).message + ". Try one of the quick suggestions below."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-[#EDE9FE] flex flex-col animate-in slide-in-from-right duration-300 text-[#312E81]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#EDE9FE] bg-[#F8F5FF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EDE9FE] border border-[#A78BFA]/30 flex items-center justify-center text-[#7C3AED]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#312E81] text-base">ParkBot AI Assistant</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
                  Intelligent Matching
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">Natural-language parking search & live slot matching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#312E81] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters strip */}
        <div className="px-4 py-2.5 bg-[#F8F5FF] border-b border-[#EDE9FE] flex items-center justify-between text-xs text-[#312E81]">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280] font-medium">City:</span>
            <select
              value={activeCity}
              onChange={e => setActiveCity(e.target.value)}
              className="bg-white border border-[#EDE9FE] rounded-lg px-2 py-1 text-[#312E81] text-xs outline-none focus:border-[#7C3AED]"
            >
              <option value="All">All Cities</option>
              <option value="Chennai">Chennai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280] font-medium">Vehicle:</span>
            <select
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value as VehicleType)}
              className="bg-white border border-[#EDE9FE] rounded-lg px-2 py-1 text-[#312E81] text-xs outline-none focus:border-[#7C3AED]"
            >
              <option value="car">Car / Sedan</option>
              <option value="ev">Electric Vehicle (EV)</option>
              <option value="suv">Large SUV</option>
              <option value="bike">Two-Wheeler / Bike</option>
            </select>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#7C3AED] text-white rounded-tr-none'
                    : 'bg-[#F8F5FF] text-[#312E81] border border-[#EDE9FE] rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>

              {/* Extracted Query Intent breakdown */}
              {msg.extracted && (
                <div className="mt-2 w-full flex flex-wrap gap-1.5 text-[10px]">
                  {msg.extracted.destination && (
                    <span className="px-2 py-0.5 rounded-lg bg-[#EDE9FE] text-[#7C3AED] font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {msg.extracted.destination}
                    </span>
                  )}
                  {msg.extracted.vehicleType && (
                    <span className="px-2 py-0.5 rounded-lg bg-[#EDE9FE] text-[#7C3AED] font-bold flex items-center gap-1 uppercase">
                      <Car className="w-3 h-3" /> {msg.extracted.vehicleType}
                    </span>
                  )}
                  {msg.extracted.durationHours && (
                    <span className="px-2 py-0.5 rounded-lg bg-[#EDE9FE] text-[#7C3AED] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {msg.extracted.durationHours} hrs
                    </span>
                  )}
                </div>
              )}

              {/* Real Database Recommendations */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-3 w-full space-y-2.5">
                  <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Top Available Spaces ({msg.recommendations.length})
                  </p>
                  {msg.recommendations.map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className="bg-white border border-[#EDE9FE] rounded-2xl p-3 hover:border-[#7C3AED] transition-all shadow-xs group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#EDE9FE] text-[#7C3AED]">
                              {rec.matchScore || 95}% Match
                            </span>
                            <h4 className="text-xs font-bold text-[#312E81] group-hover:text-[#7C3AED] transition-colors">
                              {rec.facilityName}
                            </h4>
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-1">
                            Slot <strong className="text-[#7C3AED] font-bold">{rec.slotNumber}</strong> ({rec.floor} Floor) • {rec.distanceKm} km away
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-[#7C3AED]">₹{rec.pricePerHour}/hr</p>
                          <p className="text-[10px] text-[#6B7280]">Est. ₹{rec.estimatedTotal}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#EDE9FE] flex items-center justify-between">
                        <span className="text-[10px] text-[#6B7280]">{rec.reason}</span>
                        <button
                          onClick={() => {
                            onSelectSlotToBook(
                              rec.facilityId,
                              rec.slotId,
                              msg.extracted?.durationHours || 2,
                              (msg.extracted?.vehicleType as VehicleType) || vehicleType
                            );
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <span>Reserve Slot</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#7C3AED] p-3 rounded-2xl bg-[#EDE9FE] animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Analyzing city traffic & searching live slot availability...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Strip */}
        <div className="p-3 border-t border-[#EDE9FE] bg-[#F8F5FF] space-y-1.5">
          <p className="text-[10px] text-[#6B7280] font-semibold">Suggested Searches:</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#EDE9FE] text-[#312E81] border border-[#EDE9FE] text-[11px] whitespace-nowrap transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-[#EDE9FE] bg-white">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Ask ParkBot in plain English..."
              className="flex-1 bg-[#F8F5FF] border border-[#EDE9FE] rounded-2xl px-4 py-2.5 text-xs text-[#312E81] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white transition-all shadow-md shadow-[#7C3AED]/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
