/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMediasoup } from '../hooks/useMediasoup'; // Import your enhanced hook
import { useSocket } from '../Components/Contexts/SocketContext';

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

// Connection quality indicator component
const ConnectionQuality: React.FC<{ 
  connectionState: string;
  error: any;
}> = ({ connectionState, error }) => {
  const getQualityInfo = () => {
    if (error) return { color: '#f44336', label: 'Error', icon: '🔴' };
    
    switch (connectionState) {
      case 'connected': return { color: '#4CAF50', label: 'Excellent', icon: '🟢' };
      case 'connecting': 
      case 'reconnecting': return { color: '#FF9800', label: 'Connecting', icon: '🟡' };
      case 'failed': return { color: '#f44336', label: 'Failed', icon: '🔴' };
      default: return { color: '#666', label: 'Idle', icon: '⚪' };
    }
  };

  const quality = getQualityInfo();

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '5px',
      fontSize: '12px'
    }}>
      <span>{quality.icon}</span>
      <span style={{ color: quality.color }}>{quality.label}</span>
    </div>
  );
};

// Error notification component
const ErrorNotification: React.FC<{
  error: any;
  onClose: () => void;
  onRetry?: () => void;
}> = ({ error, onClose, onRetry }) => {
  if (!error) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      backgroundColor: '#f44336',
      color: 'white',
      padding: '15px 20px',
      borderRadius: '8px',
      maxWidth: '400px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {error.type || 'Error'}
          </div>
          <div style={{ fontSize: '14px' }}>{error.message}</div>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            width: '20px',
            height: '20px'
          }}
        >
          ×
        </button>
      </div>
      
      {error.retry && onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 15px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            alignSelf: 'flex-start'
          }}
        >
          🔄 Retry Connection
        </button>
      )}
    </div>
  );
};

const MeetScreen: React.FC<MeetScreenProps> = ({ classId, token }) => {
  // Use the socket context
  const { socket, isConnected } = useSocket();
  
  // Use the enhanced MediaSoup hook
  const {
    startLocalStream,
    joinVideoCall,
    leaveVideoCall,
    peers,
    localStreamRef,
    isVideoCallReady,
    isConnecting,
    connectionState,
    error: mediasoupError,
    retryConnection
  } = useMediasoup(classId);

  // Local state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUserName] = useState('You');
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [localError, setLocalError] = useState<string>('');
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const meetingStartTimeRef = useRef<Date | null>(null);

  // Convert peers to participants for UI compatibility
  const participants: Participant[] = peers.map(peer => ({
    id: peer.id,
    name: peer.name || 'Participant',
    isVideoEnabled: peer.stream?.getVideoTracks()?.[0]?.enabled ?? false,
    isAudioEnabled: peer.stream?.getAudioTracks()?.[0]?.enabled ?? false,
    stream: peer.stream
  }));

  // Timer for meeting duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVideoCallReady && meetingStartTimeRef.current) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - meetingStartTimeRef.current!.getTime()) / 1000);
        setMeetingDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVideoCallReady]);

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

  // Handle local video display
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(e => console.error('Error playing local video:', e));
    }
  }, [localStreamRef.current]);

  // Enhanced join video call with local stream
  const handleJoinVideoCall = useCallback(async () => {
    try {
      setLocalError('');
      console.log('🎥 Starting video call process...');
      
      // Start local stream first
      await startLocalStream();
      
      // Then join the video call
      joinVideoCall();
      meetingStartTimeRef.current = new Date();
      
    } catch (error: any) {
      console.error('❌ Error joining video call:', error);
      setLocalError(`Failed to join video call: ${error.message}`);
    }
  }, [startLocalStream, joinVideoCall]);

  // Enhanced leave video call
  const handleLeaveVideoCall = useCallback(() => {
    leaveVideoCall();
    
    // Clean up local state
    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach(track => track.stop());
      screenShareStreamRef.current = null;
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    setIsScreenSharing(false);
    meetingStartTimeRef.current = null;
    setMeetingDuration(0);
    setLocalError('');
    
    console.log('👋 Left video call with cleanup');
  }, [leaveVideoCall]);

  // Toggle video with MediaSoup integration
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log(`📹 Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }, []);

  // Toggle audio with MediaSoup integration
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log(`🎤 Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }, []);

  // Screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        screenShareStreamRef.current = screenStream;
        setIsScreenSharing(true);
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenShareStreamRef.current = null;
        };
        
        console.log('🖥️ Screen sharing started');
      } else {
        if (screenShareStreamRef.current) {
          screenShareStreamRef.current.getTracks().forEach(track => track.stop());
          screenShareStreamRef.current = null;
        }
        setIsScreenSharing(false);
        console.log('🖥️ Screen sharing stopped');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setLocalError('Failed to share screen');
    }
  }, [isScreenSharing]);

  // Test camera function
  const testCamera = useCallback(async () => {
    try {
      console.log('🧪 Testing camera access...');
      setLocalError('');
      
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = testStream;
        localVideoRef.current.play();
      }
      
      console.log('✅ Camera test successful');
      
      setTimeout(() => {
        testStream.getTracks().forEach(track => track.stop());
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Camera test failed:', error);
      setLocalError(`Camera test failed: ${error.message}`);
    }
  }, []);

  // Copy meeting link
  const copyMeetingLink = useCallback(() => {
    const link = `${window.location.origin}/meet/${classId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Meeting link copied to clipboard!');
    });
  }, [classId]);

  // Clear errors
  const clearErrors = () => {
    setLocalError('');
  };

  // Get current error to display
  const currentError = mediasoupError || (localError ? { message: localError, type: 'LOCAL' } : null);

  return (
    <div className="meet-screen" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      backgroundColor: '#1a1a1a',
      color: 'white'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        backgroundColor: '#2a2a2a',
        borderBottom: '1px solid #444'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            Video Meeting - Class {classId.slice(-8)}
          </h2>
          {isVideoCallReady && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              fontSize: '14px',
              color: '#888'
            }}>
              <span>🕐 {formatDuration(meetingDuration)}</span>
              <span>👥 {participants.length + 1} participants</span>
              <ConnectionQuality 
                connectionState={connectionState} 
                error={mediasoupError}
              />
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {isVideoCallReady && (
            <>
              <button
                onClick={copyMeetingLink}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📋 Copy Link
              </button>
              
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: showParticipants ? '#2196F3' : '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                👥 Participants ({participants.length + 1})
              </button>
              
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: isChatOpen ? '#2196F3' : '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                💬 Chat
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: showSettings ? '#2196F3' : '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ⚙️ Settings
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Video Area */}
        <div style={{ 
          flex: showParticipants || isChatOpen || showSettings ? '1' : '1',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px'
        }}>
          <div className="video-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: participants.length > 0 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
            gap: '20px',
            flex: 1,
            alignContent: 'start'
          }}>
            {/* Local Video */}
            <div className="video-container" style={{ 
              position: 'relative',
              aspectRatio: '16/9',
              minHeight: '200px'
            }}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#000',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '2px solid #2196F3'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '15px',
                left: '15px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {currentUserName} {!isVideoEnabled && '(Video Off)'} {!isAudioEnabled && '(Muted)'}
              </div>
              
              {!isVideoEnabled && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  👤
                </div>
              )}

              {/* Connection state indicator on video */}
              {isConnecting && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  backgroundColor: 'rgba(255, 152, 0, 0.9)',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#FF9800',
                    animation: 'pulse 1s infinite'
                  }}></div>
                  Connecting...
                </div>
              )}
            </div>
            
            {/* Remote Videos */}
            {participants.map((participant) => (
              <div key={participant.id} className="video-container" style={{ 
                position: 'relative',
                aspectRatio: '16/9',
                minHeight: '200px'
              }}>
                <video
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && participant.stream) {
                      el.srcObject = participant.stream;
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000',
                    borderRadius: '12px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  left: '15px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {participant.name}
                  {!participant.isVideoEnabled && ' (Video Off)'}
                  {!participant.isAudioEnabled && ' (Muted)'}
                </div>
                
                {!participant.isVideoEnabled && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    👤
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        {(showParticipants || isChatOpen || showSettings) && (
          <div style={{
            width: '350px',
            backgroundColor: '#2a2a2a',
            borderLeft: '1px solid #444',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Participants Panel */}
            {showParticipants && (
              <div style={{ flex: 1, padding: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
                  Participants ({participants.length + 1})
                </h3>
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '10px 0',
                    borderBottom: '1px solid #444'
                  }}>
                    <span style={{ flex: 1 }}>{currentUserName} (You)</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {isVideoEnabled ? '📹' : '📹‍❌'}
                      {isAudioEnabled ? '🎤' : '🎤‍❌'}
                    </div>
                  </div>
                  {participants.map((participant) => (
                    <div key={participant.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px 0',
                      borderBottom: '1px solid #444'
                    }}>
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

            {/* Chat Panel */}
            {isChatOpen && (
              <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Chat</h3>
                <div style={{ 
                  flex: 1, 
                  backgroundColor: '#1a1a1a', 
                  borderRadius: '8px', 
                  padding: '15px',
                  marginBottom: '15px',
                  overflowY: 'auto'
                }}>
                  <p style={{ color: '#888', textAlign: 'center', margin: 0 }}>
                    No messages yet. Start the conversation!
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      color: 'white'
                    }}
                  />
                  <button style={{
                    padding: '10px 15px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Settings Panel */}
            {showSettings && (
              <div style={{ flex: 1, padding: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Connection Status */}
                  <div>
                    <h4 style={{ marginBottom: '10px' }}>Connection Status</h4>
                    <div style={{ 
                      padding: '10px',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}>
                      <div>State: <span style={{ color: '#4CAF50' }}>{connectionState}</span></div>
                      <div>Socket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
                      <div>Peers: {participants.length}</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ marginBottom: '10px' }}>Audio Settings</h4>
                    <button style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '10px'
                    }}>
                      🎤 Select Microphone
                    </button>
                    <button style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}>
                      🔊 Select Speaker
                    </button>
                  </div>
                  
                  <div>
                    <h4 style={{ marginBottom: '10px' }}>Video Settings</h4>
                    <button style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '10px'
                    }}>
                      📹 Select Camera
                    </button>
                    <label style={{ display: 'block', marginBottom: '10px' }}>
                      Video Quality:
                      <select style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        marginTop: '5px'
                      }}>
                        <option>HD (720p)</option>
                        <option>Full HD (1080p)</option>
                        <option>Standard (480p)</option>
                      </select>
                    </label>
                  </div>
                  
                  <div>
                    <h4 style={{ marginBottom: '10px' }}>Meeting Settings</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <input type="checkbox" />
                      Show participant names
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <input type="checkbox" />
                      Enable noise cancellation
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" defaultChecked />
                      Show connection quality
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="control-panel" style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#2a2a2a',
        borderTop: '1px solid #444'
      }}>
        {!isVideoCallReady ? (
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={testCamera}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              🧪 Test Camera
            </button>
            
            <button
              onClick={handleJoinVideoCall}
              disabled={!isConnected || isConnecting}
              style={{
                padding: '12px 24px',
                backgroundColor: 
                  isConnecting ? '#FF9800' : 
                  isConnected ? '#4CAF50' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (isConnected && !isConnecting) ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isConnecting ? '⏳' : '🎥'} 
              {isConnecting ? 'Connecting...' : 'Join Video Call'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button
              onClick={toggleVideo}
              style={{
                padding: '15px',
                backgroundColor: isVideoEnabled ? '#4CAF50' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                width: '50px',
                height: '50px'
              }}
            >
              {isVideoEnabled ? '📹' : '📹‍❌'}
            </button>
            
            <button
              onClick={toggleAudio}
              style={{
                padding: '15px',
                backgroundColor: isAudioEnabled ? '#4CAF50' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                width: '50px',
                height: '50px'
              }}
            >
              {isAudioEnabled ? '🎤' : '🎤‍❌'}
            </button>
            
            <button
              onClick={toggleScreenShare}
              style={{
                padding: '15px',
                backgroundColor: isScreenSharing ? '#FF9800' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                width: '50px',
                height: '50px'
              }}
            >
              {isScreenSharing ? '🖥️' : '📺'}
            </button>
            
            <div style={{ height: '30px', width: '1px', backgroundColor: '#666', margin: '0 10px' }}></div>
            
            <button
              onClick={handleLeaveVideoCall}
              style={{
                padding: '15px 30px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              📞 Leave Meeting
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      <ErrorNotification 
        error={currentError}
        onClose={clearErrors}
        onRetry={mediasoupError?.retry ? retryConnection : undefined}
      />

      {/* Connection Status */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '20px',
        padding: '8px 15px',
        borderRadius: '20px',
        backgroundColor: 
          connectionState === 'connected' ? 'rgba(76, 175, 80, 0.9)' :
          connectionState === 'connecting' || connectionState === 'reconnecting' ? 'rgba(255, 152, 0, 0.9)' :
          connectionState === 'failed' ? 'rgba(244, 67, 54, 0.9)' :
          'rgba(102, 102, 102, 0.9)',
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1000
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 
            connectionState === 'connected' ? '#4CAF50' :
            connectionState === 'connecting' || connectionState === 'reconnecting' ? '#FF9800' :
            connectionState === 'failed' ? '#f44336' :
            '#666',
          animation: (connectionState === 'connecting' || connectionState === 'reconnecting') ? 'pulse 1s infinite' : 'none'
        }}></div>
        {connectionState === 'connected' ? 'Connected' :
         connectionState === 'connecting' ? 'Connecting' :
         connectionState === 'reconnecting' ? 'Reconnecting' :
         connectionState === 'failed' ? 'Failed' :
         connectionState === 'initializing' ? 'Initializing' :
         'Disconnected'}
      </div>

      {/* Recording Indicator */}
      {isVideoCallReady && (
        <div style={{
          position: 'fixed',
          top: '120px',
          left: '20px',
          padding: '8px 15px',
          borderRadius: '20px',
          backgroundColor: 'rgba(255, 152, 0, 0.9)',
          color: 'white',
          fontSize: '12px',
          fontWeight: '500',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          animation: 'pulse 2s infinite'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#f44336'
          }}></div>
          Live Meeting
        </div>
      )}

      {/* Floating Action Buttons for Mobile */}
      {isVideoCallReady && window.innerWidth < 768 && (
        <div style={{
          position: 'fixed',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: showParticipants ? '#2196F3' : 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            👥
          </button>
          
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: isChatOpen ? '#2196F3' : 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            💬
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: showSettings ? '#2196F3' : 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ⚙️
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Overlay */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '20px',
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '250px',
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Keyboard Shortcuts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div>Space: Toggle mute</div>
            <div>Ctrl+D: Toggle video</div>
            <div>Ctrl+E: Leave meeting</div>
            <div>Ctrl+Shift+A: Toggle audio</div>
            <div>Ctrl+Shift+V: Toggle video</div>
          </div>
        </div>
      )}

      {/* Styles for animations */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          .video-container:hover {
            transform: scale(1.02);
            transition: transform 0.2s ease;
          }
          
          button:hover {
            opacity: 0.9;
            transition: opacity 0.2s ease;
          }
          
          button:active {
            transform: scale(0.95);
          }
          
          @media (max-width: 768px) {
            .video-grid {
              grid-template-columns: 1fr !important;
              gap: 10px !important;
            }
            
            .control-panel {
              padding: 15px !important;
            }
            
            .control-panel button {
              padding: 12px !important;
              font-size: 14px !important;
            }
          }
        `}
      </style>

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '6px',
          fontSize: '10px',
          maxWidth: '200px',
          zIndex: 1000
        }}>
          <div><strong>Debug Info:</strong></div>
          <div>Socket: {isConnected ? '🟢' : '🔴'}</div>
          <div>Connection: {connectionState}</div>
          <div>Local Stream: {localStreamRef.current ? '🟢' : '🔴'}</div>
          <div>Participants: {participants.length}</div>
          <div>Screen Share: {isScreenSharing ? '🟢' : '🔴'}</div>
          <div>Video: {isVideoEnabled ? '🟢' : '🔴'}</div>
          <div>Audio: {isAudioEnabled ? '🟢' : '🔴'}</div>
          <div>Error: {currentError ? '🔴' : '🟢'}</div>
          {mediasoupError && (
            <div style={{ marginTop: '5px', fontSize: '9px', color: '#f44336' }}>
              {mediasoupError.type}: {mediasoupError.message.substring(0, 30)}...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetScreen;
