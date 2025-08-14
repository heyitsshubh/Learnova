/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { useSocket } from "../Components/Contexts/SocketContext";

export enum ConnectionState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
  DISCONNECTED = 'disconnected'
}

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
  isConnected: boolean;
  hasJoinedClass: boolean;
}

// Retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
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
  const [hasJoinedClass, setHasJoinedClass] = useState(false);
  
  // Retry mechanism refs
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRetryingRef = useRef<boolean>(false);
  
  // Initialization flag
  const isInitializedRef = useRef(false);
  const pendingConsumersRef = useRef<Set<string>>(new Set());
  const hasJoinedClassRef = useRef(false);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // 🔥 FIX: Add transport ready tracking
  const transportReadyRef = useRef({ send: false, recv: false });

  // Computed states
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
        retryCountRef.current = 0;
        isRetryingRef.current = false;
      } catch (error) {
        isRetryingRef.current = false;
        console.error('Retry failed:', error);
        scheduleRetry(errorType, retryFn);
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
      const joinData: any = { classId };
      if (userId) joinData.userId = userId;
      if (token) joinData.token = token;

      socket.emit('joinClass', joinData);

      await createEventPromise(
        socket,
        'class_joined',
        'class_join_error',
        10000
      );

      hasJoinedClassRef.current = true;
      setHasJoinedClass(true);
      console.log('✅ Class joined successfully');
    } catch (error) {
      console.error('❌ Failed to join class:', error);
      const errorMessage = (typeof error === 'object' && error !== null && 'message' in error) ? (error as any).message : 'Failed to join class';
      setErrorWithType('CLASS_ERROR', errorMessage, true, error);
      throw error;
    }
  }, [socket, isConnected, classId, userId, token]);

  const initializeDevice = useCallback(async (rtpCapabilities: any) => {
    try {
      setConnectionState(ConnectionState.INITIALIZING);
      
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

  // 🔥 FIXED: Better transport creation with ICE servers
  const createSendTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');
      
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

      // 🔥 FIX: Create transport with ICE servers
      const sendTransport = deviceRef.current.createSendTransport({
        id: transportParams.id,
        iceParameters: transportParams.iceParameters,
        iceCandidates: transportParams.iceCandidates,
        dtlsParameters: transportParams.dtlsParameters,
        sctpParameters: transportParams.sctpParameters,
        // 🔥 CRITICAL: Add ICE servers configuration
        iceServers: transportParams.iceServers || [
          {
            urls: "turn:global.turn.twilio.com:443",
            username: "572a8528b6d50e961344ce7d4eb97280f55b57a1a740b6409d6aa5c654687d74",
            credential: "xof1gCWW2oSomiEEaiUTHVxBY0963S4jBKzyglwh1uk="
          }
        ]
      });
      
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
            15000, // Increased timeout
            (data) => data.transportId === sendTransport.id && data.direction === 'send'
          );
          
          transportReadyRef.current.send = true;
          console.log('✅ Send transport connected');
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
            15000, // Increased timeout
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
          transportReadyRef.current.send = false;
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

  // 🔥 FIXED: Better receive transport creation
  const createReceiveTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

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

      // 🔥 FIX: Create transport with ICE servers
      const recvTransport = deviceRef.current.createRecvTransport({
        id: transportParams.id,
        iceParameters: transportParams.iceParameters,
        iceCandidates: transportParams.iceCandidates,
        dtlsParameters: transportParams.dtlsParameters,
        sctpParameters: transportParams.sctpParameters,
        // 🔥 CRITICAL: Add ICE servers configuration
        iceServers: transportParams.iceServers || [
          {
            urls: "turn:global.turn.twilio.com:443",
            username: "572a8528b6d50e961344ce7d4eb97280f55b57a1a740b6409d6aa5c654687d74",
            credential: "xof1gCWW2oSomiEEaiUTHVxBY0963S4jBKzyglwh1uk="
          }
        ]
      });
      
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
            15000, // Increased timeout
            (data) => data.transportId === recvTransport.id && data.direction === 'recv'
          );
          
          transportReadyRef.current.recv = true;
          console.log('✅ Receive transport connected');
          callback();
        } catch (error) {
          console.error('Error connecting receive transport:', error);
          errback(error as Error);
        }
      });

      recvTransport.on('connectionstatechange', (state) => {
        console.log('📡 Receive transport connection state:', state);
        if (state === 'failed' || state === 'disconnected') {
          transportReadyRef.current.recv = false;
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

    // 🔥 FIX: Wait for transport to be ready
    if (!transportReadyRef.current.send) {
      console.log('⏳ Waiting for send transport to be ready...');
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (transportReadyRef.current.send) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
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

  // 🔥 COMPLETELY FIXED: Consumer creation
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

      // 🔥 FIX: Wait for receive transport to be ready
      if (!transportReadyRef.current.recv) {
        console.log('⏳ Waiting for receive transport to be ready...');
        await new Promise<void>((resolve) => {
          const checkReady = () => {
            if (transportReadyRef.current.recv) {
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });
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
        socket?.emit('start_consuming', {
          producerId,
          consumerRtpCapabilities: deviceRef.current?.rtpCapabilities
        });

        // Wait for consumer_created event
        const consumerData = await createEventPromise(
          socket,
          'consumer_created',
          'consumer_creation_failed',
          20000, // Increased timeout
          (data) => data.producerId === producerId
        );

        const typedConsumerData = consumerData as { 
          consumerId: string; 
          rtpParameters: any; 
          kind: string;
          producerPeer?: { socketId: string; userName: string; userId: string };
        };

        // 🔥 FIX: Create consumer with proper parameters
        const consumer = await recvTransportRef.current.consume({
          id: typedConsumerData.consumerId,
          producerId,
          kind: kind as mediasoupClient.types.MediaKind,
          rtpParameters: typedConsumerData.rtpParameters
        });
        
        consumersRef.current.set(consumer.id, consumer);

        // 🔥 CRITICAL FIX: Handle consumer resume properly
        console.log(`▶️ Resuming consumer: ${kind}`);
        
        // Resume consumer (the server should auto-resume, but let's be explicit)
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Consumer resume timeout'));
          }, 10000);

          const handleResume = (data: any) => {
            if (data.consumerId === consumer.id && data.success) {
              clearTimeout(timeout);
              socket?.off('consumer_resumed', handleResume);
              resolve();
            }
          };

          socket?.on('consumer_resumed', handleResume);
          
          // The server auto-resumes, but we can also manually trigger
          if (consumer.paused) {
            consumer.resume();
          }
          
          // Fallback - resolve after short delay if server auto-resumed
          setTimeout(() => {
            if (!consumer.paused) {
              clearTimeout(timeout);
              socket?.off('consumer_resumed', handleResume);
              resolve();
            }
          }, 1000);
        });

        // 🔥 CRITICAL FIX: Update peers state properly
        setPeers(prevPeers => {
          const existingPeerIndex = prevPeers.findIndex(p => p.id === producerSocketId);
          const updatedPeers = [...prevPeers];
          
          if (existingPeerIndex >= 0) {
            // Update existing peer
            const existingPeer = { ...updatedPeers[existingPeerIndex] };
            existingPeer.consumers = new Map(existingPeer.consumers);
            existingPeer.consumers.set(consumer.id, consumer);
            
            // 🔥 FIX: Create new stream with existing tracks plus new track
            const newStream = new MediaStream();
            existingPeer.stream.getTracks().forEach(track => newStream.addTrack(track));
            newStream.addTrack(consumer.track);
            existingPeer.stream = newStream;
            
            if (kind === 'video') {
              existingPeer.isVideoEnabled = true;
            } else if (kind === 'audio') {
              existingPeer.isAudioEnabled = true;
            }
            
            updatedPeers[existingPeerIndex] = existingPeer;
          } else {
            // Create new peer
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
          
          console.log(`[setPeers] Updated peers for ${kind} from ${producerName}:`, updatedPeers);
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
              const peer = { ...updatedPeers[peerIndex] };
              peer.consumers = new Map(peer.consumers);
              peer.consumers.delete(consumer.id);
              
              // 🔥 FIX: Recreate stream without this track
              const newStream = new MediaStream();
              peer.stream.getTracks().forEach(track => {
                if (track.id !== consumer.track.id) {
                  newStream.addTrack(track);
                }
              });
              peer.stream = newStream;
              
              if (kind === 'video') {
                peer.isVideoEnabled = false;
              } else if (kind === 'audio') {
                peer.isAudioEnabled = false;
              }
              
              updatedPeers[peerIndex] = peer;
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

    if (!socket.connected) {
      setErrorWithType('NETWORK', 'Socket not properly connected', true);
      return;
    }
    
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
    
    // Reset transport ready state
    transportReadyRef.current = { send: false, recv: false };
    
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
      ) as { sendTransport: any; recvTransport: any; iceServers?: any[] };

      // Step 5: Create transports with ICE servers
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
    transportReadyRef.current = { send: false, recv: false };
    clearError();

    hasJoinedClassRef.current = false;
    setHasJoinedClass(false);
    
    console.log('✅ Video call cleanup completed');
  }, [socket]);
  
  const toggleVideo = useCallback(async () => {
    const videoProducer = producersRef.current.get('video');
    if (videoProducer) {
      try {
        if (videoProducer.paused) {
          await videoProducer.resume();
          setIsVideoEnabled(true);
          console.log('📹 Video enabled');
        } else {
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
  }, []);

  const toggleAudio = useCallback(async () => {
    const audioProducer = producersRef.current.get('audio');
    if (audioProducer) {
      try {
        if (audioProducer.paused) {
          await audioProducer.resume();
          setIsAudioEnabled(true);
          console.log('🎤 Audio enabled');
        } else {
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
  }, []);

  // 🔥 FIXED: Socket event handlers with proper timing
  useEffect(() => {
    if (!socket) return;
    
    const handleClassJoined = (data: any) => {
      console.log('🏫 Class joined successfully:', data);
      hasJoinedClassRef.current = true;
      setHasJoinedClass(true);
    };
    
    // 🔥 FIX: Handle existing producers when transports are ready
    const handleExistingProducers = (producers: Array<{ 
      producerId: string, 
      kind: 'audio' | 'video', 
      producerSocketId: string, 
      producerName: string 
    }>) => {
      console.log('📡 Received existing producers:', producers);
      
      // Wait for receive transport to be ready before consuming
      const consumeWhenReady = () => {
        if (transportReadyRef.current.recv) {
          producers.forEach((producer) => {
            if (producer.producerSocketId !== socket.id) {
              setTimeout(() => {
                consumeRemoteMedia(producer.producerId, producer.producerSocketId, producer.producerName, producer.kind);
              }, 500); // Small delay between consumptions
            }
          });
        } else {
          setTimeout(consumeWhenReady, 200);
        }
      };
      
      consumeWhenReady();
    };
    
    const handleNewProducer = (data: { 
      producerId: string, 
      kind: 'audio' | 'video', 
      producerSocketId: string, 
      producerName: string 
    }) => {
      console.log('🆕 New producer available:', data.kind, 'from', data.producerName);
      if (data.producerSocketId !== socket.id && transportReadyRef.current.recv) {
        // Add delay to ensure transport is fully ready
        setTimeout(() => {
          consumeRemoteMedia(data.producerId, data.producerSocketId, data.producerName, data.kind);
        }, 1000);
      }
    };
    
    const handlePeerDisconnected = (data: { peerId: string }) => {
      console.log('👋 Peer disconnected:', data.peerId);
      setPeers(prevPeers => {
        const updatedPeers = prevPeers.filter(peer => peer.id !== data.peerId);
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

    const handleUserLeftVideo = (data: { socketId: string, userName: string }) => {
      console.log('📞 User left video:', data.userName);
      setPeers(prevPeers => {
        const updatedPeers = prevPeers.filter(peer => peer.id !== data.socketId);
        const leftPeer = prevPeers.find(peer => peer.id === data.socketId);
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

    const handleProducerClosed = (data: { producerId: string, socketId: string, kind: 'audio' | 'video' }) => {
      console.log(`🚫 Producer closed: ${data.kind} from peer ${data.socketId}`);
      
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
        const peerIndex = prevPeers.findIndex(p => p.id === data.socketId);
        if (peerIndex >= 0) {
          const updatedPeers = [...prevPeers];
          const peer = { ...updatedPeers[peerIndex] };
          
          if (data.kind === 'video') {
            peer.isVideoEnabled = false;
          } else if (data.kind === 'audio') {
            peer.isAudioEnabled = false;
          }
          
          updatedPeers[peerIndex] = peer;
          return updatedPeers;
        }
        return prevPeers;
      });
    };

    const handleError = (error: { message: string, code?: string }) => {
      console.error('🚨 Socket error:', error);
      // Only handle video call related errors
      if (error.code?.includes('VIDEO') || error.code?.includes('TRANSPORT') || error.code?.includes('CONSUMER')) {
        const errorType = error.code.includes('VIDEO') ? 'NETWORK' :
                         error.code.includes('TRANSPORT') ? 'TRANSPORT' :
                         error.code.includes('CONSUMER') ? 'CONSUMER' : 'NETWORK';
        setErrorWithType(errorType, error.message || 'Video call error occurred', true, error);
      }
    };

    // Register all event listeners
    socket.on('class_joined', handleClassJoined);
    socket.on('existing_producers', handleExistingProducers);
    socket.on('new_producer_available', handleNewProducer);
    socket.on('peer_disconnected', handlePeerDisconnected);
    socket.on('user_left_video', handleUserLeftVideo);
    socket.on('producer_closed', handleProducerClosed);
    socket.on('error', handleError);

    return () => {
      // Cleanup all event listeners
      socket.off('class_joined', handleClassJoined);
      socket.off('existing_producers', handleExistingProducers);
      socket.off('new_producer_available', handleNewProducer);
      socket.off('peer_disconnected', handlePeerDisconnected);
      socket.off('user_left_video', handleUserLeftVideo);
      socket.off('producer_closed', handleProducerClosed);
      socket.off('error', handleError);
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
      hasJoinedClassRef.current = false;
      setHasJoinedClass(false);
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
    isConnected,
    hasJoinedClass
  };
}
