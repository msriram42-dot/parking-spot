import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

export let ioInstance: SocketIOServer | null = null;

export function initSocketIO(server: HTTPServer) {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: (process.env.FRONTEND_URL || '*').split(',').map(s => s.trim()),
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket) => {
    socket.on('join_facility', (facilityId: string) => {
      socket.join(`facility_${facilityId}`);
    });

    socket.on('leave_facility', (facilityId: string) => {
      socket.leave(`facility_${facilityId}`);
    });
  });

  return ioInstance;
}
