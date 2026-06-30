import { useEffect, useRef, useState, useCallback } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiPhone } from 'react-icons/fi';
import socket from '../../lib/socket.js';
import { useVideoCall } from './VideoCallContext.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { drName } from '../../utils/drName.js';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function VideoCallModal() {
  const { callState, endCall } = useVideoCall();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [status, setStatus] = useState(callState?.role === 'caller' ? 'calling' : 'incoming');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState('');

  const { appointmentId, role, remoteUser, remotePeerId, pending } = callState ?? {};

  // ── Cleanup ────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
  }, []);

  const hangUp = useCallback((notify = true) => {
    if (notify && remotePeerId) {
      socket.emit('video:call-ended', { appointmentId, to: remotePeerId });
    }
    cleanup();
    endCall();
  }, [appointmentId, remotePeerId, cleanup, endCall]);

  const decline = useCallback(() => {
    if (remotePeerId) {
      socket.emit('video:call-declined', { appointmentId, to: remotePeerId });
    }
    endCall();
  }, [appointmentId, remotePeerId, endCall]);

  // ── Setup peer connection ──────────────────────────────────────────
  const setupPeerConnection = useCallback(async (isInitiator) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(STUN_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        setStatus('connected');
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && remotePeerId) {
          socket.emit('video:ice-candidate', {
            appointmentId,
            to: remotePeerId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          hangUp(false);
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('video:offer', { appointmentId, to: remotePeerId, offer });
        setStatus('ringing');
      }
    } catch (err) {
      setError(err.name === 'NotAllowedError'
        ? 'Camera/microphone access denied. Please allow access and try again.'
        : 'Failed to access media devices.');
    }
  }, [appointmentId, remotePeerId, hangUp]);

  // ── Socket listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!callState) return;

    const onAccepted = async ({ appointmentId: aid }) => {
      if (aid !== appointmentId) return;
      setStatus('connecting');
      await setupPeerConnection(true);
    };

    const onDeclined = ({ appointmentId: aid }) => {
      if (aid !== appointmentId) return;
      cleanup();
      endCall();
    };

    const onEnded = ({ appointmentId: aid }) => {
      if (aid !== appointmentId) return;
      cleanup();
      endCall();
    };

    const onOffer = async ({ appointmentId: aid, offer }) => {
      if (aid !== appointmentId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('video:answer', { appointmentId, to: remotePeerId, answer });
    };

    const onAnswer = async ({ appointmentId: aid, answer }) => {
      if (aid !== appointmentId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIce = async ({ appointmentId: aid, candidate }) => {
      if (aid !== appointmentId || !pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_) {}
    };

    socket.on('video:call-accepted', onAccepted);
    socket.on('video:call-declined', onDeclined);
    socket.on('video:call-ended', onEnded);
    socket.on('video:offer', onOffer);
    socket.on('video:answer', onAnswer);
    socket.on('video:ice-candidate', onIce);

    // If caller: just wait for accept/decline
    // If callee (auto-accept flow — patient accepted via button below):
    // setupPeerConnection runs when patient clicks accept

    return () => {
      socket.off('video:call-accepted', onAccepted);
      socket.off('video:call-declined', onDeclined);
      socket.off('video:call-ended', onEnded);
      socket.off('video:offer', onOffer);
      socket.off('video:answer', onAnswer);
      socket.off('video:ice-candidate', onIce);
    };
  }, [callState, appointmentId, remotePeerId, setupPeerConnection, cleanup, endCall]);

  // ── Controls ───────────────────────────────────────────────────────
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((prev) => !prev);
  };

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((prev) => !prev);
  };

  // Accept call: setup peer connection as callee, notify caller
  const acceptCall = async () => {
    socket.emit('video:call-accepted', { appointmentId, to: remotePeerId });
    setStatus('connecting');
    await setupPeerConnection(false);
  };

  // ── Render: incoming call (not yet accepted) ───────────────────────
  if (pending && status === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl w-80 text-center space-y-5">
          <Avatar src={remoteUser?.avatar} name={remoteUser?.name} size="xl" className="mx-auto" />
          <div>
            <p className="text-sm text-gray-500 font-medium">Incoming video call</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{drName(remoteUser?.name)}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={decline}
              className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors"
            >
              <FiPhoneOff size={22} className="text-white" />
            </button>
            <button
              onClick={acceptCall}
              className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-colors"
            >
              <FiPhone size={22} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl w-80 text-center space-y-4">
          <p className="text-red-500 font-medium">{error}</p>
          <button onClick={() => hangUp(false)}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Render: active call UI ─────────────────────────────────────────
  const statusText = {
    calling: 'Initiating call...',
    ringing: 'Ringing...',
    connecting: 'Connecting...',
    connected: 'Connected',
  }[status] ?? '';

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
      {/* Remote video (full screen background) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay when connecting/calling */}
      {status !== 'connected' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 space-y-4">
          <Avatar src={remoteUser?.avatar} name={remoteUser?.name} size="xl" className="ring-4 ring-white/20" />
          <p className="text-white text-lg font-semibold">
            {role === 'callee' ? drName(remoteUser?.name) : remoteUser?.name}
          </p>
          <p className="text-gray-400 text-sm">{statusText}</p>
        </div>
      )}

      {/* Local video (PiP bottom-right) */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="absolute bottom-24 right-4 w-32 h-24 rounded-xl object-cover border-2 border-white/20 shadow-xl"
      />

      {/* Status bar top */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <p className="text-white text-sm font-medium">
          {role === 'callee' ? drName(remoteUser?.name) : remoteUser?.name}
        </p>
        {status === 'connected' && (
          <span className="text-green-400 text-xs font-medium">Connected</span>
        )}
      </div>

      {/* Controls bar bottom */}
      <div className="relative z-10 mt-auto pb-10 flex items-center justify-center gap-5">
        <ControlBtn onClick={toggleMic} active={micOn} activeIcon={FiMic} offIcon={FiMicOff} label="Mic" />
        <ControlBtn onClick={toggleCam} active={camOn} activeIcon={FiVideo} offIcon={FiVideoOff} label="Cam" />
        <button
          onClick={() => hangUp(true)}
          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transition-colors"
        >
          <FiPhoneOff size={26} className="text-white" />
        </button>
      </div>
    </div>
  );
}

function ControlBtn({ onClick, active, activeIcon: ActiveIcon, offIcon: OffIcon, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
        active ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500/80 hover:bg-red-500'
      }`}
    >
      {active
        ? <ActiveIcon size={18} className="text-white" />
        : <OffIcon size={18} className="text-white" />
      }
    </button>
  );
}
