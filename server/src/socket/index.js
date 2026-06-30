import { Server } from 'socket.io';
import { env } from '../config/env.js';
import Appointment from '../modules/appointment/appointment.model.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // ── Slot availability ──────────────────────────────────────────────
    socket.on('join-slots', ({ doctorId, date }) => {
      if (doctorId && date) socket.join(`slots:${doctorId}:${date}`);
    });

    socket.on('leave-slots', ({ doctorId, date }) => {
      if (doctorId && date) socket.leave(`slots:${doctorId}:${date}`);
    });

    // ── Personal user room (for targeted DMs and call signals) ────────
    socket.on('join-user-room', ({ userId }) => {
      if (userId) socket.join(`user:${userId}`);
    });

    // ── WebRTC Video Call Signaling ───────────────────────────────────

    // Doctor → server: initiate a call
    socket.on('video:call-request', async ({ appointmentId }) => {
      try {
        const appt = await Appointment.findById(appointmentId)
          .populate('doctorId', 'name avatar')
          .populate('patientId', '_id');
        if (!appt || appt.type !== 'video') return;

        io.to(`user:${appt.patientId._id}`).emit('video:incoming-call', {
          appointmentId,
          caller: {
            name: appt.doctorId.name,
            avatar: appt.doctorId.avatar?.url ?? '',
          },
        });
      } catch (_) {
        // silently ignore DB errors during signaling
      }
    });

    // Patient → server: accepted call — notify doctor
    socket.on('video:call-accepted', ({ appointmentId, to }) => {
      io.to(`user:${to}`).emit('video:call-accepted', { appointmentId });
    });

    // Either party → server: declined or ended call
    socket.on('video:call-declined', ({ appointmentId, to }) => {
      io.to(`user:${to}`).emit('video:call-declined', { appointmentId });
    });

    socket.on('video:call-ended', ({ appointmentId, to }) => {
      io.to(`user:${to}`).emit('video:call-ended', { appointmentId });
    });

    // WebRTC offer (caller → callee)
    socket.on('video:offer', ({ appointmentId, to, offer }) => {
      io.to(`user:${to}`).emit('video:offer', { appointmentId, offer });
    });

    // WebRTC answer (callee → caller)
    socket.on('video:answer', ({ appointmentId, to, answer }) => {
      io.to(`user:${to}`).emit('video:answer', { appointmentId, answer });
    });

    // ICE candidates (bidirectional)
    socket.on('video:ice-candidate', ({ appointmentId, to, candidate }) => {
      io.to(`user:${to}`).emit('video:ice-candidate', { appointmentId, candidate });
    });
  });

  return io;
};

export const emitSlotBooked = (doctorId, date, slotId) => {
  if (!io) return;
  io.to(`slots:${doctorId}:${date}`).emit('slot:booked', { slotId });
};
