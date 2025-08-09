/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMediaSoup } from './useMediaSoup';

interface MeetScreenProps {
  classId: string;
  userId: string;
  token: string;
}

interface Participant {
  id: string;
  name: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  stream?: MediaStream;
}

const MeetScreen: React.FC<MeetScreenProps> = ({ classId, userId, token }) => {
  // Socket state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Call state
  const [isInCall, setIsInCall] = useState(false);
  const [error, setError] = useState<string>('');
  
  // UI state
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [connectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const meetingStartTimeRef = useRef<Date | null>(null);

  // MediaSoup hook
  const {
    localStream,
    remoteParticipants,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    getUserMedia,
    initializeDevice,
    createTransports,
    startProducing,
    startScreenShare,
    stopScreenShare,
    toggleAudio,
    toggleVideo,
    cleanup,
  } = useMediaSoup({ socket, classId, userId });

  // 1. Timer for meeting duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall && meetingStartTimeRef.current) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - meetingStartTimeRef.current!.getTime()) / 1000);
        setMeetingDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. Initialize Socket Connection
  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      setSocket(socketInstance);
      socketInstance.emit('joinClass', { classId, userId });
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message || 'Connection error');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [classId, token, userId]);

  // 3. Update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Join Video Call
  const joinVideoCall = useCallback(async () => {
    if (!socket) {
      setError('Socket not connected');
      return;
    }

    try {
      console.log('🎥 Joining video call...');
      setError('');
      
      // Get user media and set to local ref
      const stream = await getUserMedia();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => console.error('Error playing local video:', e));
      }
      
      // Initialize MediaSoup
      await initializeDevice();
      await createTransports();
      await startProducing(stream);
      
      // Emit join event to server
      socket.emit('join_video_call', { classId, userId });
      setIsInCall(true);
      meetingStartTimeRef.current = new Date();
      
    } catch (err: any) {
      console.error('❌ Error joining video call:', err);
      setError(`Failed to join video call: ${err.message}`);
    }
  }, [socket, classId, userId, getUserMedia, initializeDevice, createTransports, startProducing]);

  // Leave video call
  const leaveVideoCall = useCallback(() => {
    if (socket) {
      socket.emit('leave_video_call');
    }
    
    // Cleanup MediaSoup and reset state
    cleanup();
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    setIsInCall(false);
    meetingStartTimeRef.current = null;
    setMeetingDuration(0);
    
    console.log('👋 Left video call');
  }, [socket, cleanup]);

  // Test camera
  const testCamera = useCallback(async () => {
    try {
      console.log('🧪 Testing camera access...');
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = testStream;
        localVideoRef.current.play();
      }
      
      console.log('✅ Camera test successful');
      setError('');
      
      setTimeout(() => {
        testStream.getTracks().forEach(track => track.stop());
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Camera test failed:', err);
      setError(`Camera test failed: ${err.message}`);
    }
  }, []);

  // Copy meeting link
  const copyMeetingLink = useCallback(() => {
    const link = `${window.location.origin}/meet/${classId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Meeting link copied to clipboard!');
    });
  }, [classId]);

  return (
    <div className="meet-screen" style={{ ... }}>
      {/* Header */}
      <header style={{ ... }}>
        {/* ... (existing header code) ... */}
        {isInCall && (
          <div style={{ ... }}>
            <span>🕐 {formatDuration(meetingDuration)}</span>
            <span>👥 {remoteParticipants.length + 1} participants</span>
            <div style={{ ... }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: connectionQuality === 'excellent' ? '#4CAF50' : '#f44336'
              }}></div>
              <span style={{ textTransform: 'capitalize' }}>{connectionQuality}</span>
            </div>
          </div>
        )}
        {/* ... (existing header buttons) ... */}
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Video Area */}
        <div style={{ ... }}>
          <div className="video-grid" style={{
            display: 'grid',
            gridTemplateColumns: remoteParticipants.length > 0 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
            gap: '20px',
            flex: 1,
            alignContent: 'start'
          }}>
            {/* Local Video */}
            <div className="video-container" style={{ ... }}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
                style={{ ... }}
              />
              <div style={{ ... }}>
                You {!isVideoEnabled && '(Video Off)'} {!isAudioEnabled && '(Muted)'}
              </div>
              {!isVideoEnabled && (
                <div style={{ ... }}>👤</div>
              )}
            </div>
            
            {/* Remote Videos */}
            {remoteParticipants.map((participant) => (
              <div key={participant.id} className="video-container" style={{ ... }}>
                <video
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && participant.stream) {
                      el.srcObject = participant.stream;
                    }
                  }}
                  style={{ ... }}
                />
                <div style={{ ... }}>
                  {participant.name}
                  {!participant.isVideoEnabled && ' (Video Off)'}
                  {!participant.isAudioEnabled && ' (Muted)'}
                </div>
                {!participant.isVideoEnabled && (
                  <div style={{ ... }}>👤</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        {(showParticipants || isChatOpen || showSettings) && (
          <div style={{ ... }}>
            {/* Participants Panel */}
            {showParticipants && (
              <div style={{ ... }}>
                <h3 style={{ ... }}>Participants ({remoteParticipants.length + 1})</h3>
                <div>
                  <div style={{ ... }}>
                    <span style={{ flex: 1 }}>You</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {isVideoEnabled ? '📹' : '📹‍❌'}
                      {isAudioEnabled ? '🎤' : '🎤‍❌'}
                    </div>
                  </div>
                  {remoteParticipants.map((participant) => (
                    <div key={participant.id} style={{ ... }}>
                      <span style={{ flex: 1 }}>{participant.name}</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {participant.isVideoEnabled ? '📹' : '📹‍❌'}
                        {participant.isAudioEnabled ? '🎤' : '🎤‍❌'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* ... (other panels: chat, settings) ... */}
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="control-panel" style={{ ... }}>
        {!isInCall ? (
          <div style={{ ... }}>
            <button onClick={testCamera} style={{ ... }}>🧪 Test Camera</button>
            <button onClick={joinVideoCall} disabled={!isConnected} style={{ ... }}>
              🎥 Join Video Call
            </button>
          </div>
        ) : (
          <div style={{ ... }}>
            <button onClick={toggleVideo} style={{
              ...
              backgroundColor: isVideoEnabled ? '#4CAF50' : '#f44336',
            }}>
              {isVideoEnabled ? '📹' : '📹‍❌'}
            </button>
            <button onClick={toggleAudio} style={{
              ...
              backgroundColor: isAudioEnabled ? '#4CAF50' : '#f44336',
            }}>
              {isAudioEnabled ? '🎤' : '🎤‍❌'}
            </button>
            <button onClick={isScreenSharing ? stopScreenShare : startScreenShare} style={{
              ...
              backgroundColor: isScreenSharing ? '#FF9800' : '#666',
            }}>
              {isScreenSharing ? '🖥️' : '📺'}
            </button>
            <div style={{ ... }}></div>
            <button onClick={leaveVideoCall} style={{ ... }}>📞 Leave Meeting</button>
          </div>
        )}
      </div>
      
      {/* ... (error display, status, etc.) ... */}
    </div>
  );
};

export default MeetScreen;
