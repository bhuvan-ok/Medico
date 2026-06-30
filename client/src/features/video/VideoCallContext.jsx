import { createContext, useContext, useState } from 'react';

const VideoCallContext = createContext(null);

export function VideoCallProvider({ children }) {
  // null = no call active
  // { appointmentId, role: 'caller'|'callee', remoteUser: { name, avatar }, remotePeerId }
  const [callState, setCallState] = useState(null);

  const initiateCall = (appointmentId, remoteUser, remotePeerId) => {
    setCallState({ appointmentId, role: 'caller', remoteUser, remotePeerId });
  };

  const receiveCall = (appointmentId, caller) => {
    setCallState({ appointmentId, role: 'callee', remoteUser: caller, pending: true });
  };

  const endCall = () => setCallState(null);

  return (
    <VideoCallContext.Provider value={{ callState, initiateCall, receiveCall, endCall }}>
      {children}
    </VideoCallContext.Provider>
  );
}

export const useVideoCall = () => useContext(VideoCallContext);
