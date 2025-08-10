/* eslint-disable @typescript-eslint/no-unused-vars */
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
  type: 'DEVICE_INIT' | 'TRANSPORT' | 'PRODUCER' | 'CONSUMER' | 'PERMISSION' | 'NETWORK' | 'CLASS_ERROR';
  message: string;
  retry?: boolean;
  originalError?: any;
}

export interface Peer {
  id: string;
  name?: string;
  stream: MediaStream;
  consumers: Map<string, mediasoupClient.types.Consumer>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface UseMediasoupReturn {
  startLocalStream: () => Promise<MediaStream>;
  joinClass: () => Promise<void>;
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
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // ms
  maxDelay: 10000, // ms
  multiplier: 2
};

// Helper function for promise-based socket events
const createEventPromise = <T>(
  socket: any,
  successEvent: string,
  errorEvent: string = 'error',
  timeout: number = 10000,
  condition?: (data: any) => boolean
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      cleanup();
      reject(new Error(`${successEvent} timeout after ${timeout}ms`));
    }, timeout);

    const successHandler = (data: any) => {
      if (!condition || condition(data)) {
        cleanup();
        resolve(data);
      }
    };

    const errorHandler = (error: any) => {
      // Only handle relevant errors
      if (errorEvent === 'error' || error.code === errorEvent) {
        cleanup();
        reject(error);
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutHandle);
      socket.off(successEvent, successHandler);
      if (errorEvent !== 'error') {
        socket.off(errorEvent, errorHandler);
      } else {
        socket.off('error', errorHandler);
      }
    };

    socket.on(successEvent, successHandler);
    if (errorEvent !== 'error') {
      socket.on(errorEvent, errorHandler);
    } else {
      socket.on('error', errorHandler);
    }
  });
};

export function useMediasoup(classId: string, userId?: string, token?: string): UseMediasoupReturn {
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
  const pendingConsumersRef = useRef<Set<string>>(new Set());
  const hasJoinedClassRef = useRef(false);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

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
    return ['TRANSPORT', 'NETWORK', 'DEVICE_INIT', 'CLASS_ERROR'].includes(errorType);
  };

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

  // Cleanup utility
  const addCleanupFunction = (cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup);
  };

  const runCleanup = () => {
    cleanupFunctionsRef.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    cleanupFunctionsRef.current = [];
  };

  // Join class function
  const joinClass = useCallback(async (): Promise<void> => {
    if (!socket || !isConnected) {
      throw new Error('Socket not connected');
    }

    if (hasJoinedClassRef.current) {
      console.log('✅ Already joined class');
      return;
    }

    console.log('🏫 Joining class:', classId);

    try {
      // Join class with user credentials if available
      const joinData: any = { classId };
      if (userId) joinData.userId = userId;
      if (token) joinData.token = token;

      socket.emit('join_class', joinData);

      await createEventPromise(
        socket,
        'class_joined',
        'class_join_error', // More specific error event
        10000
      );

      hasJoinedClassRef.current = true;
      console.log('✅ Class joined successfully');
    } catch (error) {
      console.error('❌ Failed to join class:', error);
      const errorMessage = (typeof error === 'object' && error !== null && 'message' in error) ? (error as any).message : 'Failed to join class';
      setErrorWithType('CLASS_ERROR', errorMessage, true, error);
      throw error;
    }
  }, [socket, isConnected, classId, userId, token]);

  // Ensure a return value in all code paths (should always reach here)
  // The rest of the function remains unchanged.

  const initializeDevice = useCallback(async (rtpCapabilities: any) => {
    try {
      setConnectionState(ConnectionState.INITIALIZING);
      
      // Always create a new device to ensure clean state
      deviceRef.current = new mediasoupClient.Device();
      
      await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });
      console.log('📱 MediaSoup device loaded successfully');
      
      return true;
    } catch (error) {
      console.error('Error loading MediaSoup device:', error);
      setErrorWithType('DEVICE_INIT', 'Failed to initialize media device', true, error);
      
      scheduleRetry('DEVICE_INIT', async () => {
        await initializeDevice(rtpCapabilities);
      });
      
      return false;
    }
  }, [scheduleRetry]);

  const createSendTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');
      
      // Close existing transport if it's in a bad state
      if (sendTransportRef.current && 
          (sendTransportRef.current.closed || 
           sendTransportRef.current.connectionState === 'failed' ||
           sendTransportRef.current.connectionState === 'disconnected')) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }
      
      if (sendTransportRef.current && !sendTransportRef.current.closed) {
        return sendTransportRef.current;
      }
      
      const sendTransport = deviceRef.current.createSendTransport(transportParams);
      
      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          socket?.emit('connect_transport', {
            transportId: sendTransport.id,
            dtlsParameters,
            direction: 'send'
          });
          
          await createEventPromise(
            socket,
            'transport_connected',
            'transport_connect_error',
            10000,
            (data) => data.transportId === sendTransport.id && data.direction === 'send'
          );
          
          callback();
        } catch (error) {
          console.error('Error connecting send transport:', error);
          errback(error as Error);
        }
      });
      
      sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          socket?.emit('start_producing', {
            kind,
            rtpParameters,
          });
          
          const response = await createEventPromise(
            socket,
            'producer_created',
            'producer_create_error',
            10000,
            (data) => data.kind === kind
          );
          
          const producerResponse = response as { producerId: string };
          callback({ id: producerResponse.producerId });
        } catch (error) {
          console.error('Error producing:', error);
          errback(error as Error);
        }
      });
      
      sendTransport.on('connectionstatechange', (state) => {
        console.log('📡 Send transport connection state:', state);
        if (state === 'failed' || state === 'disconnected') {
          setErrorWithType('TRANSPORT', 'Send transport connection failed', true);
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

  const createReceiveTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

      // Close existing transport if it's in a bad state
      if (recvTransportRef.current && 
          (recvTransportRef.current.closed || 
           recvTransportRef.current.connectionState === 'failed' ||
           recvTransportRef.current.connectionState === 'disconnected')) {
        recvTransportRef.current.close();
        recvTransportRef.current = null;
      }

      if (recvTransportRef.current && !recvTransportRef.current.closed) {
        return recvTransportRef.current;
      }

      const recvTransport = deviceRef.current.createRecvTransport(transportParams);
      
      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          socket?.emit('connect_transport', {
            transportId: recvTransport.id,
            dtlsParameters,
            direction: 'recv'
          });
          
          await createEventPromise(
            socket,
            'transport_connected',
            'transport_connect_error',
            10000,
            (data) => data.transportId === recvTransport.id && data.direction === 'recv'
          );
          
          callback();
        } catch (error) {
          console.error('Error connecting receive transport:', error);
          errback(error as Error);
        }
      });

      recvTransport.on('connectionstatechange', (state) => {
        console.log('📡 Receive transport connection state:', state);
        if (state === 'failed' || state === 'disconnected') {
          setErrorWithType('TRANSPORT', 'Receive transport connection failed', true);
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
  
  const startLocalStream = useCallback(async (): Promise<MediaStream> => {
    try {
      const constraints = { 
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
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      setIsVideoEnabled(!!videoTrack && videoTrack.enabled);
      setIsAudioEnabled(!!audioTrack && audioTrack.enabled);
      
      console.log('📹 Local stream started with tracks:', {
        video: !!videoTrack,
        audio: !!audioTrack,
        videoEnabled: videoTrack?.enabled,
        audioEnabled: audioTrack?.enabled
      });
      
      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      setErrorWithType('PERMISSION', 'Failed to access camera/microphone. Please check permissions.', false, error);
      throw error;
    }
  }, []);

  const produceMedia = useCallback(async () => {
    if (!sendTransportRef.current || !localStreamRef.current) {
      console.warn('Cannot produce media - missing transport or stream');
      return;
    }

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    const audioTrack = localStreamRef.current.getAudioTracks()[0];

    try {
      // Produce video track
      if (videoTrack && !producersRef.current.has('video')) {
        console.log('🎬 Starting video production...');
        const videoProducer = await sendTransportRef.current.produce({ 
          track: videoTrack,
          encodings: [
            { maxBitrate: 500000, scalabilityMode: 'S1T3' },
            { maxBitrate: 1000000, scalabilityMode: 'S1T3' },
            { maxBitrate: 2000000, scalabilityMode: 'S1T3' }
          ]
        });
        
        producersRef.current.set('video', videoProducer);
        
        const cleanupVideoProducer = () => {
          producersRef.current.delete('video');
          if (!videoProducer.closed) {
            videoProducer.close();
          }
        };

        videoProducer.on('transportclose', () => {
          cleanupVideoProducer();
          console.log('Video producer transport closed');
        });
        
        videoProducer.on('trackended', () => {
          cleanupVideoProducer();
          console.log('Video producer track ended');
        });
        
        addCleanupFunction(cleanupVideoProducer);
        console.log('✅ Video producer created successfully');
      }

      // Produce audio track
      if (audioTrack && !producersRef.current.has('audio')) {
        console.log('🎤 Starting audio production...');
        const audioProducer = await sendTransportRef.current.produce({ 
          track: audioTrack,
          encodings: [{ maxBitrate: 128000 }]
        });
        
        producersRef.current.set('audio', audioProducer);
        
        const cleanupAudioProducer = () => {
          producersRef.current.delete('audio');
          if (!audioProducer.closed) {
            audioProducer.close();
          }
        };

        audioProducer.on('transportclose', () => {
          cleanupAudioProducer();
          console.log('Audio producer transport closed');
        });
        
        audioProducer.on('trackended', () => {
          cleanupAudioProducer();
          console.log('Audio producer track ended');
        });
        
        addCleanupFunction(cleanupAudioProducer);
        console.log('✅ Audio producer created successfully');
      }
    } catch (error) {
      console.error('Error producing media:', error);
      setErrorWithType('PRODUCER', 'Failed to produce media', true, error);
    }
  }, []);

  const consumeRemoteMedia = useCallback(async (
    producerId: string, 
    producerSocketId: string, 
    producerName: string, 
    kind: 'audio' | 'video'
  ) => {
    try {
      if (!recvTransportRef.current || !deviceRef.current) {
        console.warn('Cannot consume - missing transport or device');
        return;
      }

      // Prevent duplicate consumption
      if (pendingConsumersRef.current.has(producerId)) {
        console.warn('Already consuming producer:', producerId);
        return;
      }
      
      pendingConsumersRef.current.add(producerId);
      
      console.log(`📥 Starting to consume ${kind} from ${producerName}`);
      
      try {
        // Send consume request
        socket?.emit('start_consuming', { producerId });

        // Wait for consumer_created event
        const consumerData = await createEventPromise(
          socket,
          'consumer_created',
          'consumer_create_error',
          15000,
          (data) => data.producerId === producerId
        );

        const typedConsumerData = consumerData as { consumerId: string; rtpParameters: any };
        const consumer = await recvTransportRef.current.consume({
          id: typedConsumerData.consumerId,
          producerId,
          kind,
          rtpParameters: typedConsumerData.rtpParameters
        });
        
        consumersRef.current.set(consumer.id, consumer);

        // Resume the consumer
        socket?.emit('resume_consumer', { consumerId: consumer.id });

        // Wait for consumer_resumed event
        await createEventPromise(
          socket,
          'consumer_resumed',
          'consumer_resume_error',
          10000,
          (data) => data.consumerId === consumer.id && data.success
        );

        // Update peers state
        setPeers(prevPeers => {
          const existingPeerIndex = prevPeers.findIndex(p => p.id === producerSocketId);
          const updatedPeers = [...prevPeers];
          
          if (existingPeerIndex >= 0) {
            const existingPeer = updatedPeers[existingPeerIndex];
            existingPeer.consumers.set(consumer.id, consumer);
            existingPeer.stream.addTrack(consumer.track);
            
            if (kind === 'video') {
              existingPeer.isVideoEnabled = true;
            } else if (kind === 'audio') {
              existingPeer.isAudioEnabled = true;
            }
          } else {
            const newStream = new MediaStream();
            newStream.addTrack(consumer.track);
            
            const newPeer: Peer = {
              id: producerSocketId,
              name: producerName,
              stream: newStream,
              consumers: new Map([[consumer.id, consumer]]),
              isAudioEnabled: kind === 'audio',
              isVideoEnabled: kind === 'video'
            };
            
            updatedPeers.push(newPeer);
          }
          
          return updatedPeers;
        });

        // Handle consumer events
        const cleanupConsumer = () => {
          consumersRef.current.delete(consumer.id);
          if (!consumer.closed) {
            consumer.close();
          }
          
          setPeers(prevPeers => {
            const peerIndex = prevPeers.findIndex(p => p.id === producerSocketId);
            if (peerIndex >= 0) {
              const updatedPeers = [...prevPeers];
              const peer = updatedPeers[peerIndex];
              peer.consumers.delete(consumer.id);
              
              try {
                peer.stream.removeTrack(consumer.track);
              } catch (error) {
                console.warn('Error removing track:', error);
              }
              
              if (kind === 'video') {
                peer.isVideoEnabled = false;
              } else if (kind === 'audio') {
                peer.isAudioEnabled = false;
              }
              
              return updatedPeers;
            }
            return prevPeers;
          });
        };

        consumer.on('trackended', () => {
          console.log(`Consumer track ended: ${kind} from ${producerName}`);
          cleanupConsumer();
        });

        consumer.on('transportclose', () => {
          console.log(`Consumer transport closed: ${kind} from ${producerName}`);
          cleanupConsumer();
        });

        addCleanupFunction(cleanupConsumer);
        console.log(`✅ Consumer created and resumed successfully for ${kind} from ${producerName}`);
        
      } finally {
        pendingConsumersRef.current.delete(producerId);
      }
      
    } catch (error) {
      pendingConsumersRef.current.delete(producerId);
      console.error('Error consuming remote media:', error);
      setErrorWithType('CONSUMER', `Failed to consume remote media: ${kind}`, true, error);
    }
  }, [socket]);

  const joinVideoCall = useCallback(async () => {
    if (!socket || !isConnected) {
      setErrorWithType('NETWORK', 'Socket not connected', true);
      return;
    }

    // Check if class has been joined
    if (!hasJoinedClassRef.current) {
      setErrorWithType('CLASS_ERROR', 'Must join class before joining video call', true);
      return;
    }

    if (isInitializedRef.current && connectionState !== ConnectionState.FAILED) {
      console.warn('Video call already initialized');
      return;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setConnectionState(ConnectionState.CONNECTING);
    clearError();
    isInitializedRef.current = true;
    console.log('🎥 Joining video call for class:', classId);
    
    try {
      // Step 1: Join video call
      socket.emit('join_video_call', { classId });
      
      // Step 2: Wait for video_call_ready
      const readyData = await createEventPromise(
        socket,
        'video_call_ready',
        'video_call_error',
        20000
      );
      
      // Step 3: Initialize device
      const { rtpCapabilities } = readyData as { rtpCapabilities: any };
      const deviceInitialized = await initializeDevice(rtpCapabilities);
      if (!deviceInitialized) {
        throw new Error('Failed to initialize device');
      }
      
      // Step 4: Set RTP capabilities and wait for transports
      if (!deviceRef.current?.rtpCapabilities) {
        throw new Error('Device RTP capabilities not available');
      }

      socket.emit('set_rtp_capabilities', { 
        rtpCapabilities: deviceRef.current.rtpCapabilities 
      });
      
      const transports = await createEventPromise(
        socket,
        'transports_created',
        'transport_create_error',
        20000
      ) as { sendTransport: any; recvTransport: any };
      
      // Step 5: Create transports
      await Promise.all([
        createSendTransport(transports.sendTransport),
        createReceiveTransport(transports.recvTransport)
      ]);

      // Step 6: Start local stream and produce media
      await startLocalStream();
      await produceMedia();
      
      setConnectionState(ConnectionState.CONNECTED);
      clearError();
      console.log('✅ Video call setup complete');

    } catch (error) {
      console.error('Error during join_video_call flow:', error);
      const errorMessage = (typeof error === 'object' && error !== null && 'message' in error)
        ? (error as any).message
        : 'Failed to establish video call';
      setErrorWithType('NETWORK', errorMessage, true, error);
      setConnectionState(ConnectionState.FAILED);
      
      // Clean up partial state on failure
      runCleanup();
    }
  }, [socket, isConnected, classId, connectionState, initializeDevice, createSendTransport, createReceiveTransport, startLocalStream, produceMedia]);

  const leaveVideoCall = useCallback(() => {
    console.log('👋 Leaving video call...');
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Run all cleanup functions
    runCleanup();
    
    if (socket) {
      socket.emit('leave_video_call');
    }

    // Stop local stream
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
    }

    if (recvTransportRef.current && !recvTransportRef.current.closed) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }

    // Reset device
    deviceRef.current = null;

    // Reset state
    setPeers([]);
    setConnectionState(ConnectionState.IDLE);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    retryCountRef.current = 0;
    isRetryingRef.current = false;
    isInitializedRef.current = false;
    pendingConsumersRef.current.clear();
    clearError();
    
    console.log('✅ Video call cleanup completed');
  }, [socket]);
  
  const toggleVideo = useCallback(async () => {
    const videoProducer = producersRef.current.get('video');
    if (videoProducer) {
      try {
        if (videoProducer.paused) {
          socket?.emit('resume_producer', { kind: 'video' });
          await videoProducer.resume();
          setIsVideoEnabled(true);
          console.log('📹 Video enabled');
        } else {
          socket?.emit('pause_producer', { kind: 'video' });
          await videoProducer.pause();
          setIsVideoEnabled(false);
          console.log('📹 Video disabled');
        }
      } catch (error) {
        console.error('Error toggling video:', error);
      }
    } else if (localStreamRef.current) {
      // If no producer but we have local stream, toggle the track directly
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log(`📹 Video ${videoTrack.enabled ? 'enabled' : 'disabled'} (local track)`);
      }
    }
  }, [socket]);

  const toggleAudio = useCallback(async () => {
    const audioProducer = producersRef.current.get('audio');
    if (audioProducer) {
      try {
        if (audioProducer.paused) {
          socket?.emit('resume_producer', { kind: 'audio' });
          await audioProducer.resume();
          setIsAudioEnabled(true);
          console.log('🎤 Audio enabled');
        } else {
          socket?.emit('pause_producer', { kind: 'audio' });
          await audioProducer.pause();
          setIsAudioEnabled(false);
          console.log('🎤 Audio disabled');
        }
      } catch (error) {
        console.error('Error toggling audio:', error);
      }
    } else if (localStreamRef.current) {
      // If no producer but we have local stream, toggle the track directly
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log(`🎤 Audio ${audioTrack.enabled ? 'enabled' : 'disabled'} (local track)`);
      }
    }
  }, [socket]);
  
  // Socket event handlers
  useEffect(() => {
    if (!socket) return;
    
    const handleVideoCallReady = async (data: { rtpCapabilities: any }) => {
      console.log('📱 Video call ready event received');
      // This is handled in joinVideoCall flow
    };

    const handleClassJoined = (data: any) => {
      console.log('🏫 Class joined successfully:', data);
      hasJoinedClassRef.current = true;
    };
    
    const handleNewProducer = (data: { producerId: string, kind: 'audio' | 'video', producerSocketId: string, producerName: string }) => {
      console.log('🆕 New producer available:', data.kind, 'from', data.producerName);
      if (data.producerSocketId !== socket.id) {
        consumeRemoteMedia(data.producerId, data.producerSocketId, data.producerName, data.kind);
      }
    };
    
    const handlePeerDisconnected = (data: { peerId: string }) => {
      console.log('👋 Peer disconnected:', data.peerId);
      setPeers(prevPeers => {
        const updatedPeers = prevPeers.filter(peer => peer.id !== data.peerId);
        // Clean up any consumers for this peer
        const disconnectedPeer = prevPeers.find(peer => peer.id === data.peerId);
        if (disconnectedPeer) {
          disconnectedPeer.consumers.forEach(consumer => {
            if (!consumer.closed) {
              consumer.close();
            }
            consumersRef.current.delete(consumer.id);
          });
        }
        return updatedPeers;
      });
    };

    const handlePeerLeftVideo = (data: { peerId: string, peerName: string }) => {
      console.log('📞 Peer left video:', data.peerName);
      setPeers(prevPeers => {
        const updatedPeers = prevPeers.filter(peer => peer.id !== data.peerId);
        // Clean up any consumers for this peer
        const leftPeer = prevPeers.find(peer => peer.id === data.peerId);
        if (leftPeer) {
          leftPeer.consumers.forEach(consumer => {
            if (!consumer.closed) {
              consumer.close();
            }
            consumersRef.current.delete(consumer.id);
          });
        }
        return updatedPeers;
      });
    };

    const handleVideoCallLeft = () => {
      console.log('📞 Video call left confirmation');
      setConnectionState(ConnectionState.DISCONNECTED);
    };

    const handleError = (error: { message: string, code?: string }) => {
      console.error('🚨 Socket error:', error);
      // Only handle errors that are relevant to video calls
      if (error.code === 'VIDEO_CALL_ERROR') {
        setErrorWithType('NETWORK', error.message || 'Video call error occurred', true, error);
      } else if (error.code === 'CLASS_ERROR') {
        setErrorWithType('CLASS_ERROR', error.message || 'Class error occurred', true, error);
      } else if (error.code === 'TRANSPORT_ERROR') {
        setErrorWithType('TRANSPORT', error.message || 'Transport error occurred', true, error);
      } else if (error.code === 'PRODUCER_ERROR') {
        setErrorWithType('PRODUCER', error.message || 'Producer error occurred', true, error);
      } else if (error.code === 'CONSUMER_ERROR') {
        setErrorWithType('CONSUMER', error.message || 'Consumer error occurred', true, error);
      }
      // Ignore other socket errors that might not be related to video calls
    };

    const handlePeerMediaStateChanged = (data: { peerId: string, peerName: string, kind: 'audio' | 'video', enabled: boolean }) => {
      console.log(`📡 Peer ${data.peerName} ${data.kind} ${data.enabled ? 'enabled' : 'disabled'}`);
      setPeers(prevPeers => {
        const peerIndex = prevPeers.findIndex(p => p.id === data.peerId);
        if (peerIndex >= 0) {
          const updatedPeers = [...prevPeers];
          const peer = updatedPeers[peerIndex];
          
          if (data.kind === 'video') {
            peer.isVideoEnabled = data.enabled;
          } else if (data.kind === 'audio') {
            peer.isAudioEnabled = data.enabled;
          }
          
          return updatedPeers;
        }
        return prevPeers;
      });
    };

    const handleUserJoinedVideo = (data: { userId: string, userName: string, socketId: string }) => {
      console.log('👥 User joined video:', data.userName);
      // This will be handled when producers are available
    };

    const handleProducerClosed = (data: { producerId: string, peerId: string, kind: 'audio' | 'video' }) => {
      console.log(`🚫 Producer closed: ${data.kind} from peer ${data.peerId}`);
      // Clean up any related consumers
      const consumersToClose = Array.from(consumersRef.current.entries())
        .filter(([_, consumer]) => consumer.producerId === data.producerId);
      
      consumersToClose.forEach(([consumerId, consumer]) => {
        if (!consumer.closed) {
          consumer.close();
        }
        consumersRef.current.delete(consumerId);
      });

      // Update peer state
      setPeers(prevPeers => {
        const peerIndex = prevPeers.findIndex(p => p.id === data.peerId);
        if (peerIndex >= 0) {
          const updatedPeers = [...prevPeers];
          const peer = updatedPeers[peerIndex];
          
          if (data.kind === 'video') {
            peer.isVideoEnabled = false;
          } else if (data.kind === 'audio') {
            peer.isAudioEnabled = false;
          }
          
          return updatedPeers;
        }
        return prevPeers;
      });
    };

    // Register event listeners
    socket.on('video_call_ready', handleVideoCallReady);
    socket.on('class_joined', handleClassJoined);
    socket.on('new_producer_available', handleNewProducer);
    socket.on('peer_disconnected', handlePeerDisconnected);
    socket.on('peer_left_video', handlePeerLeftVideo);
    socket.on('video_call_left', handleVideoCallLeft);
    socket.on('error', handleError);
    socket.on('peer_media_state_changed', handlePeerMediaStateChanged);
    socket.on('user_joined_video', handleUserJoinedVideo);
    socket.on('producer_closed', handleProducerClosed);

    return () => {
      socket.off('video_call_ready', handleVideoCallReady);
      socket.off('class_joined', handleClassJoined);
      socket.off('new_producer_available', handleNewProducer);
      socket.off('peer_disconnected', handlePeerDisconnected);
      socket.off('peer_left_video', handlePeerLeftVideo);
      socket.off('video_call_left', handleVideoCallLeft);
      socket.off('error', handleError);
      socket.off('peer_media_state_changed', handlePeerMediaStateChanged);
      socket.off('user_joined_video', handleUserJoinedVideo);
      socket.off('producer_closed', handleProducerClosed);
    };
  }, [socket, consumeRemoteMedia]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        leaveVideoCall();
      }
    };
  }, [leaveVideoCall]);

  // Handle socket reconnection
  useEffect(() => {
    if (socket && isConnected && connectionState === ConnectionState.FAILED) {
      console.log('🔄 Socket reconnected, attempting to rejoin video call');
      retryConnection();
    }
  }, [socket, isConnected, connectionState]);
  
  // Retry connection function
  const retryConnection = useCallback(() => {
    if (connectionState === ConnectionState.FAILED || connectionState === ConnectionState.DISCONNECTED) {
      retryCountRef.current = 0;
      isRetryingRef.current = false;
      isInitializedRef.current = false;
      hasJoinedClassRef.current = false; // Reset class join status on retry
      clearError();
      joinVideoCall();
    }
  }, [connectionState, joinVideoCall]);

  return {
    startLocalStream,
    joinClass,
    joinVideoCall,
    leaveVideoCall,
    toggleVideo,
    toggleAudio,
    peers,
    localStreamRef,
    isVideoCallReady,
    isConnecting,
    connectionState,
    error,
    retryConnection,
    clearError,
    isVideoEnabled,
    isAudioEnabled,
  };
}