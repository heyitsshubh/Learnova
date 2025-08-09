/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { useSocket } from "../Components/Contexts/SocketContext";

// Connection State Enum
export enum ConnectionState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
  DISCONNECTED = 'disconnected'
}

// Error Types for better categorization
export interface MediasoupError {
  type: 'DEVICE_INIT' | 'TRANSPORT' | 'PRODUCER' | 'CONSUMER' | 'PERMISSION' | 'NETWORK';
  message: string;
  retry?: boolean;
  originalError?: any;
}

export interface Peer {
  id: string;
  name?: string;
  stream: MediaStream;
  consumers: Map<string, mediasoupClient.types.Consumer>;
}

export interface UseMediasoupReturn {
  startLocalStream: () => Promise<MediaStream>;
  joinVideoCall: () => void;
  leaveVideoCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  peers: Peer[];
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  isVideoCallReady: boolean;
  isConnecting: boolean;
  connectionState: ConnectionState;
  error: MediasoupError | null;
  retryConnection: () => void;
  clearError: () => void;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  multiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  multiplier: 2
};

export function useMediasoup(classId: string): UseMediasoupReturn {
  const { socket, isConnected } = useSocket();
  
  // MediaSoup refs
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const producersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());
  
  // State management
  const [peers, setPeers] = useState<Peer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [error, setError] = useState<MediasoupError | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  // Retry mechanism refs
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRetryingRef = useRef<boolean>(false);
  
  // Initialization flag
  const isInitializedRef = useRef(false);
  const rtpCapabilitiesRef = useRef<any>(null);

  // Computed states for backward compatibility
  const isVideoCallReady = connectionState === ConnectionState.CONNECTED;
  const isConnecting = [ConnectionState.INITIALIZING, ConnectionState.CONNECTING, ConnectionState.RECONNECTING].includes(connectionState);

  // Helper functions
  const setErrorWithType = (type: MediasoupError['type'], message: string, retry = false, originalError?: any) => {
    const newError: MediasoupError = { type, message, retry, originalError };
    setError(newError);
    console.error(`[${type}] ${message}`, originalError || '');
  };

  const clearError = () => setError(null);

  const calculateRetryDelay = (attempt: number): number => {
    const delay = DEFAULT_RETRY_CONFIG.baseDelay * Math.pow(DEFAULT_RETRY_CONFIG.multiplier, attempt);
    return Math.min(delay, DEFAULT_RETRY_CONFIG.maxDelay);
  };

  const canRetry = (errorType: MediasoupError['type']): boolean => {
    return ['TRANSPORT', 'NETWORK', 'DEVICE_INIT'].includes(errorType);
  };

  // Retry mechanism
  const scheduleRetry = useCallback((errorType: MediasoupError['type'], retryFn: () => Promise<void>) => {
    if (!canRetry(errorType) || retryCountRef.current >= DEFAULT_RETRY_CONFIG.maxRetries) {
      setConnectionState(ConnectionState.FAILED);
      return;
    }

    if (isRetryingRef.current) return;

    const delay = calculateRetryDelay(retryCountRef.current);
    retryCountRef.current++;
    isRetryingRef.current = true;
    
    console.log(`⏰ Scheduling retry ${retryCountRef.current}/${DEFAULT_RETRY_CONFIG.maxRetries} in ${delay}ms`);
    setConnectionState(ConnectionState.RECONNECTING);

    retryTimeoutRef.current = setTimeout(async () => {
      try {
        await retryFn();
        retryCountRef.current = 0; // Reset on success
        isRetryingRef.current = false;
      } catch (error) {
        isRetryingRef.current = false;
        console.error('Retry failed:', error);
        scheduleRetry(errorType, retryFn); // Schedule next retry
      }
    }, delay);
  }, []);

  // Manual retry function
  const retryConnection = useCallback(() => {
    if (connectionState === ConnectionState.FAILED || error) {
      console.log('🔄 Manual retry triggered');
      retryCountRef.current = 0;
      clearError();
      joinVideoCall();
    }
  }, [connectionState, error]);

  // Initialize MediaSoup Device with retry
  const initializeDevice = useCallback(async (rtpCapabilities: any) => {
    try {
      setConnectionState(ConnectionState.INITIALIZING);
      
      if (!deviceRef.current) {
        deviceRef.current = new mediasoupClient.Device();
      }
      
      if (!deviceRef.current.loaded) {
        await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });
        console.log('📱 MediaSoup device loaded successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error loading MediaSoup device:', error);
      setErrorWithType('DEVICE_INIT', 'Failed to initialize media device', true, error);
      
      // Schedule retry for device initialization
      scheduleRetry('DEVICE_INIT', async () => {
        await initializeDevice(rtpCapabilities);
      });
      
      return false;
    }
  }, [scheduleRetry]);

  // Create Send Transport with retry mechanism
  const createSendTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

      const sendTransport = deviceRef.current.createSendTransport(transportParams);
      
      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log('🔗 Send transport connecting...');
          
          const connectPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Transport connection timeout'));
            }, 15000);

            const connectHandler = (data: any) => {
              if (data.transportId === sendTransport.id && data.direction === 'send') {
                clearTimeout(timeout);
                socket?.off('transport_connected', connectHandler);
                socket?.off('transport_connect_error', errorHandler);
                resolve();
              }
            };

            const errorHandler = (data: any) => {
              if (data.transportId === sendTransport.id) {
                clearTimeout(timeout);
                socket?.off('transport_connected', connectHandler);
                socket?.off('transport_connect_error', errorHandler);
                reject(new Error(data.error || 'Transport connection failed'));
              }
            };

            socket?.on('transport_connected', connectHandler);
            socket?.on('transport_connect_error', errorHandler);
          });

          socket?.emit('connect_transport', {
            transportId: sendTransport.id,
            dtlsParameters,
            direction: 'send'
          });

          await connectPromise;
          callback();
        } catch (error) {
          console.error('Error connecting send transport:', error);
          errback(error as Error);
        }
      });

      sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          console.log(`📤 Producing ${kind}...`);
          
          const producePromise = new Promise<{ id: string }>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Producer creation timeout'));
            }, 15000);

            const produceHandler = (data: any) => {
              if (data.kind === kind) {
                clearTimeout(timeout);
                socket?.off('producer_created', produceHandler);
                socket?.off('producer_error', errorHandler);
                resolve({ id: data.producerId });
              }
            };

            const errorHandler = (data: any) => {
              if (data.kind === kind) {
                clearTimeout(timeout);
                socket?.off('producer_created', produceHandler);
                socket?.off('producer_error', errorHandler);
                reject(new Error(data.error || 'Producer creation failed'));
              }
            };

            socket?.on('producer_created', produceHandler);
            socket?.on('producer_error', errorHandler);
          });

          socket?.emit('start_producing', { kind, rtpParameters });
          const result = await producePromise;
          callback(result);
        } catch (error) {
          console.error('Error producing:', error);
          errback(error as Error);
        }
      });

      sendTransport.on('connectionstatechange', (state) => {
        console.log('📡 Send transport connection state:', state);
        
        if (state === 'connected') {
          clearError();
        } else if (state === 'failed' || state === 'disconnected') {
          setErrorWithType('TRANSPORT', 'Send transport connection failed', true);
          
          // Schedule retry for transport reconnection
          scheduleRetry('TRANSPORT', async () => {
            await createSendTransport(transportParams);
          });
        }
      });

      sendTransportRef.current = sendTransport;
      console.log('✅ Send transport created successfully');
      return sendTransport;
    } catch (error) {
      console.error('Error creating send transport:', error);
      setErrorWithType('TRANSPORT', 'Failed to create send transport', true, error);
      throw error;
    }
  }, [socket, scheduleRetry]);

  // Create Receive Transport with retry mechanism
  const createReceiveTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

      const recvTransport = deviceRef.current.createRecvTransport(transportParams);
      
      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log('🔗 Receive transport connecting...');
          
          const connectPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Transport connection timeout'));
            }, 15000);

            const connectHandler = (data: any) => {
              if (data.transportId === recvTransport.id && data.direction === 'recv') {
                clearTimeout(timeout);
                socket?.off('transport_connected', connectHandler);
                socket?.off('transport_connect_error', errorHandler);
                resolve();
              }
            };

            const errorHandler = (data: any) => {
              if (data.transportId === recvTransport.id) {
                clearTimeout(timeout);
                socket?.off('transport_connected', connectHandler);
                socket?.off('transport_connect_error', errorHandler);
                reject(new Error(data.error || 'Transport connection failed'));
              }
            };

            socket?.on('transport_connected', connectHandler);
            socket?.on('transport_connect_error', errorHandler);
          });

          socket?.emit('connect_transport', {
            transportId: recvTransport.id,
            dtlsParameters,
            direction: 'recv'
          });

          await connectPromise;
          callback();
        } catch (error) {
          console.error('Error connecting receive transport:', error);
          errback(error as Error);
        }
      });

      recvTransport.on('connectionstatechange', (state) => {
        console.log('📡 Receive transport connection state:', state);
        
        if (state === 'connected') {
          clearError();
        } else if (state === 'failed' || state === 'disconnected') {
          setErrorWithType('TRANSPORT', 'Receive transport connection failed', true);
          
          // Schedule retry for transport reconnection
          scheduleRetry('TRANSPORT', async () => {
            await createReceiveTransport(transportParams);
          });
        }
      });

      recvTransportRef.current = recvTransport;
      console.log('✅ Receive transport created successfully');
      return recvTransport;
    } catch (error) {
      console.error('Error creating receive transport:', error);
      setErrorWithType('TRANSPORT', 'Failed to create receive transport', true, error);
      throw error;
    }
  }, [socket, scheduleRetry]);

  // Start Local Media Stream with better error handling
  const startLocalStream = useCallback(async (): Promise<MediaStream> => {
    try {
      // Try high quality first, fallback to lower quality
      let constraints = { 
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

      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.warn('High quality stream failed, trying lower quality:', error);
        // Fallback to lower quality
        constraints = {
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 }, 
            frameRate: { ideal: 15 } 
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      localStreamRef.current = stream;
      
      // Set initial enabled states based on tracks
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      if (videoTrack) {
        setIsVideoEnabled(videoTrack.enabled);
      }
      if (audioTrack) {
        setIsAudioEnabled(audioTrack.enabled);
      }
      
      console.log('📹 Local stream started with tracks:', 
        stream.getVideoTracks().length, 'video,', 
        stream.getAudioTracks().length, 'audio');
      return stream;
    } catch (error) {
      console.error('Error starting local stream:', error);
      setErrorWithType('PERMISSION', 'Failed to access camera/microphone. Please check permissions.', false, error);
      throw error;
    }
  }, []);

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

  // Produce Local Media with retry logic
  const produceMedia = useCallback(async () => {
    try {
      if (!sendTransportRef.current || !localStreamRef.current) {
        console.warn('Cannot produce media - missing transport or stream');
        return;
      }

      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const audioTrack = localStreamRef.current.getAudioTracks()[0];

      const producePromises = [];

      if (videoTrack && !producersRef.current.has('video')) {
        const produceVideo = async () => {
          try {
            const videoProducer = await sendTransportRef.current!.produce({ track: videoTrack });
            producersRef.current.set('video', videoProducer);
            
            videoProducer.on('transportclose', () => {
              console.log('Video producer transport closed');
              producersRef.current.delete('video');
            });

            console.log('✅ Video producer created successfully');
          } catch (error) {
            console.error('Error creating video producer:', error);
            setErrorWithType('PRODUCER', 'Failed to create video producer', true, error);
          }
        };
        producePromises.push(produceVideo());
      }

      if (audioTrack && !producersRef.current.has('audio')) {
        const produceAudio = async () => {
          try {
            const audioProducer = await sendTransportRef.current!.produce({ track: audioTrack });
            producersRef.current.set('audio', audioProducer);
            
            audioProducer.on('transportclose', () => {
              console.log('Audio producer transport closed');
              producersRef.current.delete('audio');
            });

            console.log('✅ Audio producer created successfully');
          } catch (error) {
            console.error('Error creating audio producer:', error);
            setErrorWithType('PRODUCER', 'Failed to create audio producer', true, error);
          }
        };
        producePromises.push(produceAudio());
      }

      await Promise.allSettled(producePromises);
    } catch (error) {
      console.error('Error producing media:', error);
      setErrorWithType('PRODUCER', 'Failed to share media', true, error);
    }
  }, []);

  // Consume Remote Media with better error handling
  const consumeRemoteMedia = useCallback(async (
    producerId: string, 
    producerSocketId: string, 
    producerName: string, 
    kind: string
  ) => {
    try {
      if (!recvTransportRef.current || !deviceRef.current) {
        console.warn('Cannot consume - missing transport or device');
        return;
      }

      console.log(`📥 Starting to consume ${kind} from ${producerName}`);

      const consumePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Consumer creation timeout'));
        }, 15000);

        const consumerHandler = async (data: any) => {
          if (data.producerId === producerId) {
            clearTimeout(timeout);
            socket?.off('consumer_created', consumerHandler);
            socket?.off('consumer_error', errorHandler);

            try {
              const consumer = await recvTransportRef.current!.consume({
                id: data.consumerId,
                producerId: data.producerId,
                kind: data.kind,
                rtpParameters: data.rtpParameters
              });

              consumersRef.current.set(consumer.id, consumer);

              consumer.on('transportclose', () => {
                console.log(`Consumer ${consumer.id} transport closed`);
                consumersRef.current.delete(consumer.id);
              });

              // Resume the consumer
              socket?.emit('resume_consumer', { consumerId: consumer.id });

              const stream = new MediaStream([consumer.track]);

              setPeers(prevPeers => {
                const existingPeerIndex = prevPeers.findIndex(p => p.id === producerSocketId);
                
                if (existingPeerIndex >= 0) {
                  const updatedPeers = [...prevPeers];
                  const existingPeer = updatedPeers[existingPeerIndex];
                  
                  if (consumer.track.kind === 'video') {
                    const videoTracks = existingPeer.stream.getVideoTracks();
                    videoTracks.forEach(track => {
                      existingPeer.stream.removeTrack(track);
                      track.stop();
                    });
                    existingPeer.stream.addTrack(consumer.track);
                  } else if (consumer.track.kind === 'audio') {
                    const audioTracks = existingPeer.stream.getAudioTracks();
                    audioTracks.forEach(track => {
                      existingPeer.stream.removeTrack(track);
                      track.stop();
                    });
                    existingPeer.stream.addTrack(consumer.track);
                  }
                  
                  existingPeer.consumers.set(consumer.id, consumer);
                  return updatedPeers;
                } else {
                  const newPeer: Peer = {
                    id: producerSocketId,
                    name: producerName,
                    stream: stream,
                    consumers: new Map([[consumer.id, consumer]])
                  };
                  return [...prevPeers, newPeer];
                }
              });

              console.log(`✅ Consumer created successfully for ${kind} from ${producerName}`);
              resolve();
            } catch (error) {
              console.error('Error creating consumer:', error);
              setErrorWithType('CONSUMER', `Failed to consume ${kind} from ${producerName}`, true, error);
              reject(error);
            }
          }
        };

        const errorHandler = (data: any) => {
          if (data.producerId === producerId) {
            clearTimeout(timeout);
            socket?.off('consumer_created', consumerHandler);
            socket?.off('consumer_error', errorHandler);
            setErrorWithType('CONSUMER', data.error || 'Consumer creation failed', true);
            reject(new Error(data.error || 'Consumer creation failed'));
          }
        };

        socket?.on('consumer_created', consumerHandler);
        socket?.on('consumer_error', errorHandler);
      });

      socket?.emit('start_consuming', { producerId });
      await consumePromise;

    } catch (error) {
      console.error('Error consuming remote media:', error);
      setErrorWithType('CONSUMER', `Failed to consume remote media: ${kind}`, true, error);
    }
  }, [socket]);

  // Join Video Call with enhanced state management
  const joinVideoCall = useCallback(() => {
    if (!socket || !isConnected) {
      setErrorWithType('NETWORK', 'Socket not connected', true);
      return;
    }

    if (isInitializedRef.current && connectionState !== ConnectionState.FAILED) {
      console.warn('Video call already initialized');
      return;
    }

    // Cancel any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setConnectionState(ConnectionState.CONNECTING);
    clearError();
    isInitializedRef.current = true;
    console.log('🎥 Joining video call for class:', classId);
    
    socket.emit('join_video_call', { classId });
  }, [socket, isConnected, classId, connectionState]);

  // Leave Video Call with proper cleanup
  const leaveVideoCall = useCallback(() => {
    console.log('👋 Leaving video call...');
    
    // Cancel any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (socket) {
      socket.emit('leave_video_call');
    }

    // Clean up local resources
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
    }

    // Close producers
    producersRef.current.forEach((producer, kind) => {
      if (!producer.closed) {
        producer.close();
        console.log(`Closed ${kind} producer`);
      }
    });
    producersRef.current.clear();

    // Close consumers
    consumersRef.current.forEach(consumer => {
      if (!consumer.closed) {
        consumer.close();
      }
    });
    consumersRef.current.clear();

    // Close transports
    if (sendTransportRef.current && !sendTransportRef.current.closed) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
      console.log('Closed send transport');
    }

    if (recvTransportRef.current && !recvTransportRef.current.closed) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
      console.log('Closed receive transport');
    }

    // Reset device
    deviceRef.current = null;

    // Clear state
    setPeers([]);
    setConnectionState(ConnectionState.IDLE);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    retryCountRef.current = 0;
    isRetryingRef.current = false;
    isInitializedRef.current = false;
    rtpCapabilitiesRef.current = null;
    clearError();

    console.log('✅ Video call cleanup completed');
  }, [socket]);

  // Socket Event Handlers
  useEffect(() => {
    if (!socket) return;

    // Video call ready - device initialization
    const handleVideoCallReady = async (data: { rtpCapabilities: any }) => {
      console.log('📱 Video call ready, initializing device...');
      rtpCapabilitiesRef.current = data.rtpCapabilities;
      
      try {
        const success = await initializeDevice(data.rtpCapabilities);
        if (success && deviceRef.current) {
          socket.emit('set_rtp_capabilities', {
            rtpCapabilities: deviceRef.current.rtpCapabilities
          });
        }
      } catch (error) {
        console.error('Error initializing device:', error);
        setErrorWithType('DEVICE_INIT', 'Failed to initialize video call', true, error);
      }
    };

    // Transports created
    const handleTransportsCreated = async (data: { sendTransport: any; recvTransport: any }) => {
      console.log('🚛 Transports created, setting up...');
      
      try {
        await Promise.all([
          createSendTransport(data.sendTransport),
          createReceiveTransport(data.recvTransport)
        ]);
        
        setConnectionState(ConnectionState.CONNECTED);
        clearError();
        
        // Produce local media after transports are ready
        await produceMedia();
        
        console.log('✅ Video call setup complete');
      } catch (error) {
        console.error('Error setting up transports:', error);
        setErrorWithType('TRANSPORT', 'Failed to setup video call transports', true, error);
      }
    };

    // New producer available
    const handleNewProducer = (data: { 
      producerId: string; 
      kind: string; 
      producerSocketId: string; 
      producerName: string;
    }) => {
      console.log('🆕 New producer available:', data.kind, 'from', data.producerName);
      consumeRemoteMedia(data.producerId, data.producerSocketId, data.producerName, data.kind);
    };

    // Peer disconnected
    const handlePeerDisconnected = (data: { peerId: string }) => {
      console.log('👋 Peer disconnected:', data.peerId);
      setPeers(prevPeers => prevPeers.filter(peer => peer.id !== data.peerId));
    };

    // Video call left
    const handleVideoCallLeft = () => {
      console.log('📞 Video call left confirmation');
      setConnectionState(ConnectionState.DISCONNECTED);
    };

    // Error handling
    const handleError = (error: { message: string; code?: string }) => {
      console.error('🚨 Socket error:', error);
      setErrorWithType('NETWORK', error.message || 'An error occurred', true, error);
    };

    // Register event handlers
    socket.on('video_call_ready', handleVideoCallReady);
    socket.on('transports_created', handleTransportsCreated);
    socket.on('new_producer_available', handleNewProducer);
    socket.on('peer_disconnected', handlePeerDisconnected);
    socket.on('video_call_left', handleVideoCallLeft);
    socket.on('error', handleError);

    return () => {
      socket.off('video_call_ready', handleVideoCallReady);
      socket.off('transports_created', handleTransportsCreated);
      socket.off('new_producer_available', handleNewProducer);
      socket.off('peer_disconnected', handlePeerDisconnected);
      socket.off('video_call_left', handleVideoCallLeft);
      socket.off('transport_connected');
      socket.off('transport_connect_error');
      socket.off('producer_created');
      socket.off('producer_error');
      socket.off('consumer_created');
      socket.off('consumer_error');
      socket.off('consumer_resumed');
      socket.off('error', handleError);
    };
  }, [socket, initializeDevice, createSendTransport, createReceiveTransport, produceMedia, consumeRemoteMedia]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        leaveVideoCall();
      }
    };
  }, [leaveVideoCall]);

  return {
    startLocalStream,
    joinVideoCall,
    leaveVideoCall,
    toggleVideo,
    toggleAudio,
    peers,
    localStreamRef,
    isVideoCallReady,
    isConnecting,
    error
  };
}
