/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from 'react';


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


  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [localError, setLocalError] = useState<string>('');
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);

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


    }
  }, [localStreamRef.current]);

  // Enhanced join video call with local stream
  const handleJoinVideoCall = useCallback(async () => {
    try {
      setLocalError('');
      console.log('🎥 Starting video call process...');
      

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
    <div className="meet-screen" style={{ ... }}>
      {/* Header */}

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

          </div>
        )}
      </div>


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

    </div>
  );
};

export default MeetScreen;
