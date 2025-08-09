import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

interface MeetScreenProps {
  classId: string;
  userId: string;
  token: string;
}

const MeetScreen: React.FC<MeetScreenProps> = ({ classId, userId, token }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [error, setError] = useState<string>('');
  const [remoteVideos, setRemoteVideos] = useState<Map<string, { stream: MediaStream, userName: string }>>(new Map());
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const producersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());

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
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      console.log('🎥 Requesting camera/microphone access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia(mediaConfig);
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => console.error('Error playing local video:', e));
      }
      
      console.log('✅ Camera/microphone access granted');
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      console.log('🎤 Audio tracks:', stream.getAudioTracks().length);
      
      return stream;
      
    } catch (error: any) {
      console.error('❌ Error accessing camera/microphone:', error);
      
      let errorMessage = 'Failed to access camera/microphone';
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Camera/microphone access denied. Please allow permissions and refresh the page.';
          break;
        case 'NotFoundError':
          errorMessage = 'No camera/microphone found. Please check your devices are connected.';
          break;
        case 'NotReadableError':
          errorMessage = 'Camera/microphone is being used by another application. Please close other apps using the camera.';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Camera resolution not supported. Trying with lower quality...';
          // Fallback to lower quality
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: { width: 640, height: 480 },
              audio: true
            });
            localStreamRef.current = fallbackStream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = fallbackStream;
            }
            return fallbackStream;
          } catch (fallbackError) {
            errorMessage = 'Camera not supported with any resolution.';
          }
          break;
        case 'SecurityError':
          errorMessage = 'Security error: HTTPS is required for camera access in production.';
          break;
        default:
          errorMessage = `Camera error: ${error.message}`;
      }
      
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Join Video Call with MediaSoup
  const joinVideoCall = useCallback(async () => {
    if (!socket) {
      setError('Socket not connected');
      return;
    }

    try {
      console.log('🎥 Joining video call...');
      setError(''); // Clear any previous errors
      
      // First get user media
      const stream = await getUserMedia();
      
      // Create MediaSoup device
      const device = new mediasoupClient.Device();
      deviceRef.current = device;
      
      // Join video call to get RTP capabilities
      socket.emit('join_video_call', { classId });
      
    } catch (error: any) {
      console.error('❌ Error joining video call:', error);
      setError(`Failed to join video call: ${error.message}`);
    }
  }, [socket, classId, getUserMedia]);

  // Socket Event Handlers for WebRTC
  useEffect(() => {
    if (!socket) return;

    // Video call ready - receive RTP capabilities
    socket.on('video_call_ready', async (data) => {
      try {
        console.log('📡 Video call ready, loading device with RTP capabilities');
        
        if (!deviceRef.current) {
          console.error('Device not initialized');
          return;
        }

        // Load the device with server's RTP capabilities
        await deviceRef.current.load({ routerRtpCapabilities: data.rtpCapabilities });
        
        console.log('✅ Device loaded successfully');
        console.log('📱 RTP capabilities:', deviceRef.current.rtpCapabilities);
        
        // Send our RTP capabilities to server
        socket.emit('set_rtp_capabilities', {
          rtpCapabilities: deviceRef.current.rtpCapabilities
        });
        
      } catch (error) {
        console.error('❌ Error loading device:', error);
        setError(`Failed to initialize WebRTC device: ${error}`);
      }
    });

    // Transports created
    socket.on('transports_created', async (data) => {
      try {
        console.log('🚛 Creating transports');
        
        if (!deviceRef.current) {
          console.error('Device not loaded');
          return;
        }

        // Create send transport
        const sendTransport = deviceRef.current.createSendTransport({
          id: data.sendTransport.id,
          iceParameters: data.sendTransport.iceParameters,
          iceCandidates: data.sendTransport.iceCandidates,
          dtlsParameters: data.sendTransport.dtlsParameters
        });

        // Create receive transport
        const recvTransport = deviceRef.current.createRecvTransport({
          id: data.recvTransport.id,
          iceParameters: data.recvTransport.iceParameters,
          iceCandidates: data.recvTransport.iceCandidates,
          dtlsParameters: data.recvTransport.dtlsParameters
        });

        // Handle send transport connect
        sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            socket.emit('connect_transport', {
              transportId: sendTransport.id,
              dtlsParameters,
              direction: 'send'
            });
            
            // Wait for server confirmation
            socket.once('transport_connected', (response) => {
              if (response.direction === 'send' && response.success) {
                callback();
              } else {
                errback(new Error('Failed to connect send transport'));
              }
            });
          } catch (error) {
            errback(error);
          }
        });

        // Handle send transport produce
        sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          try {
            socket.emit('start_producing', { kind, rtpParameters });
            
            socket.once('producer_created', (response) => {
              if (response.kind === kind) {
                callback({ id: response.producerId });
              } else {
                errback(new Error('Failed to create producer'));
              }
            });
          } catch (error) {
            errback(error);
          }
        });

        // Handle receive transport connect
        recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            socket.emit('connect_transport', {
              transportId: recvTransport.id,
              dtlsParameters,
              direction: 'recv'
            });
            
            socket.once('transport_connected', (response) => {
              if (response.direction === 'recv' && response.success) {
                callback();
              } else {
                errback(new Error('Failed to connect receive transport'));
              }
            });
          } catch (error) {
            errback(error);
          }
        });

        sendTransportRef.current = sendTransport;
        recvTransportRef.current = recvTransport;

        console.log('✅ Transports created successfully');
        
        // Start producing if we have a local stream
        if (localStreamRef.current) {
          await startProducing();
        }
        
      } catch (error) {
        console.error('❌ Error creating transports:', error);
        setError(`Failed to create transports: ${error}`);
      }
    });

    // New producer available (someone else started video/audio)
    socket.on('new_producer_available', async (data) => {
      try {
        console.log('🎬 New producer available:', data);
        
        if (!recvTransportRef.current) {
          console.error('Receive transport not ready');
          return;
        }

        // Start consuming this producer
        const consumer = await recvTransportRef.current.consume({
          id: data.producerId,
          producerId: data.producerId,
          kind: data.kind,
          rtpParameters: {} // This will be filled by the server response
        });

        // Store consumer
        consumersRef.current.set(data.producerId, consumer);
        
        // Add remote video stream
        if (data.kind === 'video') {
          const stream = new MediaStream([consumer.track]);
          setRemoteVideos(prev => new Map(prev.set(data.producerSocketId, {
            stream,
            userName: data.producerName || 'Unknown'
          })));
        }

        console.log(`✅ Started consuming ${data.kind} from ${data.producerName}`);
        
      } catch (error) {
        console.error('❌ Error consuming producer:', error);
      }
    });

    // Consumer created
    socket.on('consumer_created', async (data) => {
      try {
        console.log('🍿 Consumer created:', data);
        
        // Resume the consumer
        socket.emit('resume_consumer', {
          consumerId: data.consumerId
        });
        
      } catch (error) {
        console.error('❌ Error handling consumer created:', error);
      }
    });

    return () => {
      socket.off('video_call_ready');
      socket.off('transports_created');
      socket.off('new_producer_available');
      socket.off('consumer_created');
    };
  }, [socket]);

  // Start producing video and audio
  const startProducing = useCallback(async () => {
    if (!sendTransportRef.current || !localStreamRef.current) {
      console.error('Send transport or local stream not available');
      return;
    }

    try {
      // Produce video
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const videoProducer = await sendTransportRef.current.produce({
          track: videoTrack,
          codecOptions: {
            videoGoogleStartBitrate: 1000
          }
        });
        
        producersRef.current.set('video', videoProducer);
        console.log('📹 Video producer created');
        
        videoProducer.on('trackended', () => {
          console.log('Video track ended');
        });
      }

      // Produce audio
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const audioProducer = await sendTransportRef.current.produce({
          track: audioTrack
        });
        
        producersRef.current.set('audio', audioProducer);
        console.log('🎤 Audio producer created');
        
        audioProducer.on('trackended', () => {
          console.log('Audio track ended');
        });
      }

      setIsInCall(true);
      
    } catch (error) {
      console.error('❌ Error starting production:', error);
      setError(`Failed to start video/audio: ${error}`);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        // Also pause/resume producer if it exists
        const videoProducer = producersRef.current.get('video');
        if (videoProducer) {
          if (videoTrack.enabled) {
            videoProducer.resume();
          } else {
            videoProducer.pause();
          }
        }
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
        
        // Also pause/resume producer if it exists
        const audioProducer = producersRef.current.get('audio');
        if (audioProducer) {
          if (audioTrack.enabled) {
            audioProducer.resume();
          } else {
            audioProducer.pause();
          }
        }
      }
    }
  }, []);

  // Leave video call
  const leaveVideoCall = useCallback(() => {
    if (socket) {
      socket.emit('leave_video_call');
    }
    
    // Close all producers
    producersRef.current.forEach(producer => {
      if (!producer.closed) {
        producer.close();
      }
    });
    producersRef.current.clear();
    
    // Close all consumers
    consumersRef.current.forEach(consumer => {
      if (!consumer.closed) {
        consumer.close();
      }
    });
    consumersRef.current.clear();
    
    // Close transports
    if (sendTransportRef.current && !sendTransportRef.current.closed) {
      sendTransportRef.current.close();
    }
    if (recvTransportRef.current && !recvTransportRef.current.closed) {
      recvTransportRef.current.close();
    }
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    // Clear remote videos
    setRemoteVideos(new Map());
    setIsInCall(false);
    
    console.log('👋 Left video call');
  }, [socket]);

  // Test camera access independently
  const testCamera = useCallback(async () => {
    try {
      console.log('🧪 Testing camera access...');
      
      // Simple test without MediaSoup
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
      
      // Stop test stream after 2 seconds
      setTimeout(() => {
        testStream.getTracks().forEach(track => track.stop());
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Camera test failed:', error);
      setError(`Camera test failed: ${error.message}`);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVideoCall();
    };
  }, [leaveVideoCall]);

  return (
    <div className="meet-screen" style={{ padding: '20px', height: '100vh', backgroundColor: '#1a1a1a' }}>
      <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
        Video Meeting - Class {classId}
      </h2>
      
      <div className="video-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '100px'
      }}>
        {/* Local Video */}
        <div className="video-container" style={{ position: 'relative' }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
            style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#000',
              borderRadius: '8px',
              objectFit: 'cover'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            You {!isVideoEnabled && '(Video Off)'} {!isAudioEnabled && '(Muted)'}
          </div>
        </div>
        
        {/* Remote Videos */}
        {Array.from(remoteVideos.entries()).map(([peerId, peer]) => (
          <div key={peerId} className="video-container" style={{ position: 'relative' }}>
            <video
              autoPlay
              playsInline
              ref={(el) => {
                if (el && peer.stream) {
                  el.srcObject = peer.stream;
                }
              }}
              style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#000',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {peer.userName}
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
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        {!isInCall ? (
          <>
            <button
              onClick={testCamera}
              style={{
                padding: '12px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🧪 Test Camera
            </button>
            
            <button
              onClick={joinVideoCall}
              disabled={!isConnected}
              style={{
                padding: '12px 20px',
                backgroundColor: isConnected ? '#4CAF50' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🎥 Join Video Call
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleVideo}
              style={{
                padding: '12px 20px',
                backgroundColor: isVideoEnabled ? '#4CAF50' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {isVideoEnabled ? '📹' : '📹‍❌'} Video
            </button>
            
            <button
              onClick={toggleAudio}
              style={{
                padding: '12px 20px',
                backgroundColor: isAudioEnabled ? '#4CAF50' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {isAudioEnabled ? '🎤' : '🎤‍❌'} Audio
            </button>
            
            <button
              onClick={leaveVideoCall}
              style={{
                padding: '12px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📞 Leave Call
            </button>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          maxWidth: '400px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Camera Error</div>
          <div style={{ fontSize: '14px' }}>{error}</div>
          <button 
            onClick={() => setError('')}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px'
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
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: isConnected ? '#4CAF50' : '#f44336',
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Debug Info */}
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
          maxWidth: '200px'
        }}>
          <div>Socket: {isConnected ? 'Connected' : 'Disconnected'}</div>
          <div>In Call: {isInCall ? 'Yes' : 'No'}</div>
          <div>Local Stream: {localStreamRef.current ? 'Active' : 'None'}</div>
          <div>Remote Peers: {remoteVideos.size}</div>
        </div>
      )}
    </div>
  );
};

export default MeetScreen;
