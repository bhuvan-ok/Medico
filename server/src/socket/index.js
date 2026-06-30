import { Server } from 'socket.io';
import { env } from '../config/env.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-slots', ({ doctorId, date }) => {
      if (doctorId && date) socket.join(`slots:${doctorId}:${date}`);
    });

    socket.on('leave-slots', ({ doctorId, date }) => {
      if (doctorId && date) socket.leave(`slots:${doctorId}:${date}`);
    });
  });

  return io;
};

export const emitSlotBooked = (doctorId, date, slotId) => {
  if (!io) return;
  io.to(`slots:${doctorId}:${date}`).emit('slot:booked', { slotId });
};
