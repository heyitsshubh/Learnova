import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface MeetScreenProps {
  classId: string;
  userId: string;
  token: string;
}

interface MediaConfig {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  };
  audio: true;
}

const MeetScreen: React.FC<MeetScreenProps> = ({ classId, userId, token }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [peers, setPeers] = useState<Map<string, any>>(new Map());
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const deviceRef = useRef<RTCRtpTransceiver | null>(null);
  const sendTransportRef = useRef<any>(null);
  const recvTransportRef = useRef<any>(null);
  const producersRef = useRef<Map<string, any>>(new Map());
  const consumersRef = useRef<Map<string, any>>(new Map());

  // Initialize Socket Connection
  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      setSocket(socketInstance);
      
      // Join the class
      socketInstance.emit('joinClass', { classId });
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message || 'Connection error');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [classId, token]);

  // Get User Media (Camera/Microphone)
  const getUserMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      const mediaConfig: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      console.log('🎥 Requesting camera/microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia(mediaConfig);
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('✅ Camera/microphone access granted');
      return stream;
      
    } catch (error: any) {
      console.error('❌ Error accessing camera/microphone:', error);
      
      let errorMessage = 'Failed to access camera/microphone';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access denied. Please allow permissions and refresh.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found. Please check your devices.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is being used by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera/microphone constraints not supported.';
      }
      
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Join Video Call
  const joinVideoCall = useCallback(async () => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    try {
      console.log('🎥 Joining video call...');
      
      // First get user media
      await getUserMedia();
      
      // Join video call
      socket.emit('join_video_call', { classId });
      
    } catch (error) {
      console.error('❌ Error joining video call:', error);
    }
  }, [socket, classId, getUserMedia]);

  // Socket Event Handlers for WebRTC
  useEffect(() => {
    if (!socket) return;

    // Video call ready - receive RTP capabilities
    socket.on('video_call_ready', async (data) => {
      console.log('📡 Video call ready, setting RTP capabilities');
      
      // Set RTP capabilities (you'll need to implement this based on your WebRTC library)
      socket.emit('set_rtp_capabilities', {
        rtpCapabilities: data.rtpCapabilities // This should be your device's RTP capabilities
      });
    });

    // Transports created
    socket.on('transports_created', async (data) => {
      console.log('🚛 Transports created');
      
      // Create send transport for sending video/audio
      const sendTransportOptions = {
        id: data.sendTransport.id,
        iceParameters: data.sendTransport.iceParameters,
        iceCandidates: data.sendTransport.iceCandidates,
        dtlsParameters: data.sendTransport.dtlsParameters
      };

      // Create receive transport for receiving video/audio
      const recvTransportOptions = {
        id: data.recvTransport.id,
        iceParameters: data.recvTransport.iceParameters,
        iceCandidates: data.recvTransport.iceCandidates,
        dtlsParameters: data.recvTransport.dtlsParameters
      };

      // You'll need to implement transport creation based on your WebRTC library
      // For now, storing the options
      sendTransportRef.current = sendTransportOptions;
      recvTransportRef.current = recvTransportOptions;
      
      // Connect transports
      socket.emit('connect_transport', {
        transportId: data.sendTransport.id,
        dtlsParameters: data.sendTransport.dtlsParameters,
        direction: 'send'
      });
      
      socket.emit('connect_transport', {
        transportId: data.recvTransport.id,
        dtlsParameters: data.recvTransport.dtlsParameters,
        direction: 'recv'
      });
    });

    // Transport connected
    socket.on('transport_connected', (data) => {
      console.log(`🔗 Transport connected: ${data.direction}`);
      
      if (data.direction === 'send' && localStreamRef.current) {
        // Start producing video and audio
        startProducing('video');
        startProducing('audio');
      }
    });

    // New producer available (someone else started video/audio)
    socket.on('new_producer_available', (data) => {
      console.log('🎬 New producer available:', data);
      
      // Start consuming this producer
      socket.emit('start_consuming', {
        producerId: data.producerId
      });
    });

    // Consumer created
    socket.on('consumer_created', (data) => {
      console.log('🍿 Consumer created:', data);
      
      // Resume the consumer
      socket.emit('resume_consumer', {
        consumerId: data.consumerId
      });
    });

    return () => {
      socket.off('video_call_ready');
      socket.off('transports_created');
      socket.off('transport_connected');
      socket.off('new_producer_available');
      socket.off('consumer_created');
    };
  }, [socket]);

  // Start producing video or audio
  const startProducing = useCallback(async (kind: 'video' | 'audio') => {
    if (!socket || !localStreamRef.current) return;

    try {
      const track = kind === 'video' 
        ? localStreamRef.current.getVideoTracks()[0]
        : localStreamRef.current.getAudioTracks()[0];
      
      if (!track) {
        console.error(`No ${kind} track found`);
        return;
      }

      // This is a simplified version - you'll need proper RTP parameters
      // In a real implementation, you'd use a WebRTC library like mediasoup-client
      const rtpParameters = {
        // You need to implement proper RTP parameters generation
        // This depends on your WebRTC library
      };

      socket.emit('start_producing', {
        kind,
        rtpParameters // This should contain proper RTP parameters
      });
      
    } catch (error) {
      console.error(`❌ Error producing ${kind}:`, error);
    }
  }, [socket]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Leave video call
  const leaveVideoCall = useCallback(() => {
    if (socket) {
      socket.emit('leave_video_call');
    }
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    // Clear all refs
    producersRef.current.clear();
    consumersRef.current.clear();
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVideoCall();
    };
  }, [leaveVideoCall]);

  return (
    <div className="meet-screen">
      <div className="video-grid">
        {/* Local Video */}
        <div className="video-container">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
            style={{
              width: '300px',
              height: '200px',
              backgroundColor: '#000',
              borderRadius: '8px'
            }}
          />
          <div className="video-controls">
            <span>You</span>
          </div>
        </div>
        
        {/* Remote Videos */}
        {Array.from(peers.entries()).map(([peerId, peer]) => (
          <div key={peerId} className="video-container">
            <video
              autoPlay
              playsInline
              style={{
                width: '300px',
                height: '200px',
                backgroundColor: '#000',
                borderRadius: '8px'
              }}
            />
            <div className="video-controls">
              <span>{peer.userName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="control-panel" style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '8px'
      }}>
        <button
          onClick={joinVideoCall}
          disabled={!isConnected}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Join Video Call
        </button>
        
        <button
          onClick={toggleVideo}
          style={{
            padding: '10px 20px',
            backgroundColor: isVideoEnabled ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isVideoEnabled ? '📹' : '📹‍❌'} Video
        </button>
        
        <button
          onClick={toggleAudio}
          style={{
            padding: '10px 20px',
            backgroundColor: isAudioEnabled ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isAudioEnabled ? '🎤' : '🎤‍❌'} Audio
        </button>
        
        <button
          onClick={leaveVideoCall}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Leave Call
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          maxWidth: '300px'
        }}>
          {error}
          <button 
            onClick={() => setError('')}
            style={{
              marginLeft: '10px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Connection Status */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        padding: '5px 10px',
        borderRadius: '4px',
        backgroundColor: isConnected ? '#4CAF50' : '#f44336',
        color: 'white',
        fontSize: '12px'
      }}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
    </div>
  );
};

export default MeetScreen;
