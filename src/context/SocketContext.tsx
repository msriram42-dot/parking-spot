import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ParkingSlot } from '../types/index.ts';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastUpdatedSlot: { slot: ParkingSlot; facilityId: string } | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  lastUpdatedSlot: null,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdatedSlot, setLastUpdatedSlot] = useState<{ slot: ParkingSlot; facilityId: string } | null>(null);

  useEffect(() => {
    // On Vercel the Socket.IO server runs on the separate Express backend.
    const apiOrigin = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/+$/, '');
    const socketClient = io(apiOrigin || window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketClient.on('connect', () => {
      setIsConnected(true);
    });

    socketClient.on('disconnect', () => {
      setIsConnected(false);
    });

    socketClient.on('slot_updated', (data: { slot: ParkingSlot; facilityId: string }) => {
      setLastUpdatedSlot(data);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, lastUpdatedSlot }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
