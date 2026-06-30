import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace('/api/v1', '');

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

export default socket;
