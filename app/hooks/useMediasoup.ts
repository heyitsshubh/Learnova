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

// Helper function to fetch TURN credentials
// ...existing code...
async function getTurnConfig(): Promise<any[]> {
  try {
    console.log("🌐 Fetching TURN credentials from https://api.heyitsshubh.me/turn-credentials ...");
    const res = await fetch("https://project2-zphf.onrender.com/api/turn-credentials", {
      method: "GET"
    });
    console.log("🔄 Response status:", res.status, res.statusText);

    if (!res.ok) {
      console.error("❌ Failed to fetch TURN credentials:", res.statusText);
      throw new Error(`Failed to fetch TURN credentials: ${res.statusText}`);
    }

    const json = await res.json();
    console.log("📦 Received TURN credentials JSON:", json);

    const { username, credential, urls } = json;
    console.log("✅ Parsed TURN credentials:", { urls, username, credential });

    return [
      {
        urls,
        username,
        credential
      }
    ];
  } catch (error) {
    console.error("Failed to fetch TURN credentials:", error);
    return [];
  }
}
// ...existing code...
export function useMediasoup(classId: string, userId?: string, token?: string): UseMediasoupReturn {
  const { socket, isConnected } = useSocket();
  
  // MediaSoup refs
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const producersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());
  const pendingProducersRef = useRef<Array<{ producerId: string, producerSocketId: string, producerName: string, kind: 'audio' | 'video' }>>([]);
  
  // State management
  const [peers, setPeers] = useState<Peer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [error, setError] = useState<MediasoupError | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [hasJoinedClass, setHasJoinedClass] = useState(false);

  // ICE servers state
  const [iceServers, setIceServers] = useState<any[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]);

  // Fetch TURN credentials on mount
  useEffect(() => {
    getTurnConfig().then(turnServers => {
      if (turnServers.length > 0) {
        setIceServers(prev => [...prev, ...turnServers]);
        console.log("🔑 Loaded TURN servers:", turnServers);
      }
    });
  }, []);

  // Internal refs for tracking state
  const hasJoinedClassRef = useRef(false);
  const isInitializedRef = useRef(false);
  const pendingConsumersRef = useRef<Set<string>>(new Set());
  
  // 🔥 CRITICAL: Add transport ready tracking back
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
      return false;
    }
  }, []);

  // 🔥 FIXED: Transport creation with proper connection handling
  const createSendTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');
      
      if (sendTransportRef.current && !sendTransportRef.current.closed) {
        console.log('✅ Send transport already exists');
        return sendTransportRef.current;
      }

      console.log('🚛 Creating send transport...');
      
      const sendTransport = deviceRef.current.createSendTransport({
        id: transportParams.id,
        iceParameters: transportParams.iceParameters,
        iceCandidates: transportParams.iceCandidates,
        dtlsParameters: transportParams.dtlsParameters,
        sctpParameters: transportParams.sctpParameters,
        iceServers, // <-- use dynamic servers
        iceTransportPolicy: 'all', // Allow both STUN and TURN
      });
        
      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log('🔗 Send transport connect event fired! MediaSoup is connecting...');
          
          socket?.emit('connect_transport', {
            transportId: sendTransport.id,
            dtlsParameters,
            direction: 'send'
          });
          
          console.log('📤 Emitted connect_transport, waiting for server response...');
          
          const response = await createEventPromise(
            socket,
            'transport_connected',
            'transport_connect_error',
            15000,
            (data) => data.transportId === sendTransport.id && data.direction === 'send'
          );
          
          console.log('✅ Server confirmed transport connection:', response);
          callback();
        } catch (error) {
          console.error('❌ Error in send transport connect handler:', error);
          errback(error as Error);
        }
      });

      // Connection state tracking for debugging
      sendTransport.on('connectionstatechange', (state) => {
        console.log('📡 Send transport connectionstatechange:', state);
        if (state === 'connected') {
          transportReadyRef.current.send = true;
          console.log('✅ Send transport fully connected!');
        } else if (state === 'failed' || state === 'disconnected') {
          transportReadyRef.current.send = false;
          console.log('❌ Send transport connection failed/disconnected');
          setErrorWithType('TRANSPORT', 'Send transport connection failed', true);
        }
      });

      sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          console.log(`🎬 Transport produce event - creating ${kind} producer on server...`);
          socket?.emit('start_producing', {
            kind,
            rtpParameters,
          });
          
          const response = await createEventPromise(
            socket,
            'producer_created',
            'producer_create_error',
            15000,
            (data) => data.kind === kind
          );
          
          const producerResponse = response as { producerId: string };
          console.log(`✅ Server created producer: ${kind} - ID: ${producerResponse.producerId}`);
          callback({ id: producerResponse.producerId });
        } catch (error) {
          console.error(`❌ Error in produce event handler for ${kind}:`, error);
          errback(error as Error);
        }
      });

      sendTransportRef.current = sendTransport;
      console.log('✅ Send transport created (will connect when producing)');
      return sendTransport;
    } catch (error) {
      console.error('Error creating send transport:', error);
      setErrorWithType('TRANSPORT', 'Failed to create send transport', true, error);
      throw error;
    }
  }, [socket, iceServers]);

  const createReceiveTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

      if (recvTransportRef.current && !recvTransportRef.current.closed) {
        console.log('✅ Receive transport already exists');
        return recvTransportRef.current;
      }

      console.log('📡 Creating receive transport...');

      const recvTransport = deviceRef.current.createRecvTransport({
        id: transportParams.id,
        iceParameters: transportParams.iceParameters,
        iceCandidates: transportParams.iceCandidates,
        dtlsParameters: transportParams.dtlsParameters,
        sctpParameters: transportParams.sctpParameters,
        iceServers, // <-- use dynamic servers
        iceTransportPolicy: 'all',
      });
      
      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log('🔗 Connecting receive transport...');
          socket?.emit('connect_transport', {
            transportId: recvTransport.id,
            dtlsParameters,
            direction: 'recv'
          });
          
          await createEventPromise(
            socket,
            'transport_connected',
            'transport_connect_error',
            15000,
            (data) => data.transportId === recvTransport.id && data.direction === 'recv'
          );
          
          console.log('✅ Receive transport connected');
          callback();
        } catch (error) {
          console.error('Error connecting receive transport:', error);
          errback(error as Error);
        }
      });

      recvTransport.on('connectionstatechange', (state) => {
        console.log('📡 Receive transport connection state:', state);
        if (state === 'connected') {
          transportReadyRef.current.recv = true;
          console.log('✅ Receive transport is now ready for consuming');
          // Consume any pending producers
          pendingProducersRef.current.forEach(producer => {
            consumeRemoteMedia(producer.producerId, producer.producerSocketId, producer.producerName, producer.kind);
          });
          pendingProducersRef.current = [];
        } else if (state === 'failed' || state === 'disconnected') {
          transportReadyRef.current.recv = false;
          setErrorWithType('TRANSPORT', 'Receive transport connection failed', true);
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
  }, [socket, iceServers]);
  
  const startLocalStream = useCallback(async (): Promise<MediaStream> => {
    try {
      console.log('🎥 Starting local media stream...');
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
      
      console.log('✅ Local stream started with tracks:', {
        video: !!videoTrack,
        audio: !!audioTrack,
        videoId: videoTrack?.id,
        audioId: audioTrack?.id
      });
      
      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      setErrorWithType('PERMISSION', 'Failed to access camera/microphone. Please check permissions.', false, error);
      throw error;
    }
  }, []);

  // 🔥 FIXED: Proper wait for transport ready state
  const produceMedia = useCallback(async () => {
    if (!sendTransportRef.current || !localStreamRef.current) {
      console.warn('Cannot produce media - missing transport or stream');
      return;
    }

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    const audioTrack = localStreamRef.current.getAudioTracks()[0];

    console.log('🎬 Starting media production with tracks:', {
      video: !!videoTrack,
      audio: !!audioTrack,
      videoId: videoTrack?.id,
      audioId: audioTrack?.id
    });

    // 🔥 DON'T WAIT - Just start producing! MediaSoup will trigger connect event automatically
    try {
      // Produce video track
      if (videoTrack && !producersRef.current.has('video')) {
        console.log('📹 Producing video... (this will trigger transport connection)');
        const videoProducer = await sendTransportRef.current.produce({ 
          track: videoTrack,
          encodings: [
            { maxBitrate: 500000, scalabilityMode: 'S1T3' },
            { maxBitrate: 1000000, scalabilityMode: 'S1T3' },
            { maxBitrate: 2000000, scalabilityMode: 'S1T3' }
          ]
        });
        
        producersRef.current.set('video', videoProducer);
        
        videoProducer.on('transportclose', () => {
          console.log('Video producer transport closed');
          producersRef.current.delete('video');
        });
        
        videoProducer.on('trackended', () => {
          console.log('Video producer track ended');
          producersRef.current.delete('video');
        });
        
        console.log('✅ Video producer created - ID:', videoProducer.id);
      }

      // Produce audio track
      if (audioTrack && !producersRef.current.has('audio')) {
        console.log('🎤 Producing audio... (this will also use the connected transport)');
        const audioProducer = await sendTransportRef.current.produce({ 
          track: audioTrack,
          encodings: [{ maxBitrate: 128000 }]
        });
        
        producersRef.current.set('audio', audioProducer);
        
        audioProducer.on('transportclose', () => {
          console.log('Audio producer transport closed');
          producersRef.current.delete('audio');
        });
        
        audioProducer.on('trackended', () => {
          console.log('Audio producer track ended');
          producersRef.current.delete('audio');
        });
        
        console.log('✅ Audio producer created - ID:', audioProducer.id);
      }

      console.log('✅ Media production completed successfully');
      
      // Now mark as ready since production succeeded
      transportReadyRef.current.send = true;
      
    } catch (error) {
      console.error('Error producing media:', error);
      setErrorWithType('PRODUCER', 'Failed to produce media', true, error);
      throw error;
    }
  }, []);

  // Consumer creation - simplified but functional
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

      // Wait for receive transport to be ready
      if (!transportReadyRef.current.recv) {
        console.log('⏳ Waiting for receive transport to be ready...');
        const maxWait = 5000;
        const checkInterval = 100;
        let waited = 0;
        
        while (!transportReadyRef.current.recv && waited < maxWait) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          waited += checkInterval;
        }
        
        if (!transportReadyRef.current.recv) {
          console.warn('Receive transport not ready, skipping consumption');
          return;
        }
      }

      // Prevent duplicate consumption
      if (pendingConsumersRef.current.has(producerId)) {
        console.warn('Already consuming producer:', producerId);
        return;
      }
      
      pendingConsumersRef.current.add(producerId);
      
      console.log(`📥 Starting to consume ${kind} from ${producerName} (${producerId})`);
      
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
          20000,
          (data) => data.producerId === producerId
        );

        const typedConsumerData = consumerData as { 
          consumerId: string; 
          rtpParameters: any; 
          kind: string;
          producerPeer?: { socketId: string; userName: string; userId: string };
        };

        console.log(`🍿 Creating consumer for ${kind} from ${producerName}...`);

        const consumer = await recvTransportRef.current.consume({
          id: typedConsumerData.consumerId,
          producerId,
          kind: kind as mediasoupClient.types.MediaKind,
          rtpParameters: typedConsumerData.rtpParameters
        });
        
        consumersRef.current.set(consumer.id, consumer);

        // Ensure consumer is not paused
        if (consumer.paused) {
          console.log(`▶️ Resuming consumer: ${kind}`);
          consumer.resume();
        }

        console.log(`✅ Consumer created and active for ${kind}:`, {
          consumerId: consumer.id,
          producerId,
          paused: consumer.paused,
          track: consumer.track,
          trackId: consumer.track?.id,
          trackEnabled: consumer.track?.enabled,
          trackReadyState: consumer.track?.readyState
        });

        // Update peers state with proper stream handling
        setPeers(prevPeers => {
          const existingPeerIndex = prevPeers.findIndex(p => p.id === producerSocketId);
          const updatedPeers = [...prevPeers];
          
          if (existingPeerIndex >= 0) {
            // Update existing peer
            const existingPeer = { ...updatedPeers[existingPeerIndex] };
            existingPeer.consumers = new Map(existingPeer.consumers);
            existingPeer.consumers.set(consumer.id, consumer);
            
            // Create completely new stream and add unique tracks
            const newStream = new MediaStream();
            const trackIds = new Set<string>();
            existingPeer.stream.getTracks().forEach(track => {
              if (track.readyState === 'live' && !trackIds.has(track.id)) {
                newStream.addTrack(track);
                trackIds.add(track.id);
              }
            });
            if (consumer.track && consumer.track.readyState === 'live' && !trackIds.has(consumer.track.id)) {
              newStream.addTrack(consumer.track);
            }
            
            existingPeer.stream = newStream;
            
            if (kind === 'video') {
              existingPeer.isVideoEnabled = true;
            } else if (kind === 'audio') {
              existingPeer.isAudioEnabled = true;
            }
            
            updatedPeers[existingPeerIndex] = existingPeer;
            
            console.log(`[UPDATE] Updated peer ${producerName} with ${kind} track`);
          } else {
            // Create new peer
            const newStream = new MediaStream();
            if (consumer.track && consumer.track.readyState === 'live') {
              newStream.addTrack(consumer.track);
            }
            
            const newPeer: Peer = {
              id: producerSocketId,
              name: producerName,
              stream: newStream,
              consumers: new Map([[consumer.id, consumer]]),
              isAudioEnabled: kind === 'audio',
              isVideoEnabled: kind === 'video'
            };
            
            updatedPeers.push(newPeer);
            
            console.log(`[NEW] Created peer ${producerName} with ${kind} track`);
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
              const peer = { ...updatedPeers[peerIndex] };
              peer.consumers = new Map(peer.consumers);
              peer.consumers.delete(consumer.id);
              
              // Recreate stream without this track
              const newStream = new MediaStream();
              peer.stream.getTracks().forEach(track => {
                if (track.id !== consumer.track?.id && track.readyState === 'live') {
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
    
    if (!hasJoinedClassRef.current) {
      setErrorWithType('CLASS_ERROR', 'Must join class before joining video call', true);
      return;
    }
    
    if (isInitializedRef.current && connectionState !== ConnectionState.FAILED) {
      console.warn('Video call already initialized');
      return;
    }
    
    setConnectionState(ConnectionState.CONNECTING);
    clearError();
    isInitializedRef.current = true;
    
    // Reset transport ready state
    transportReadyRef.current = { send: false, recv: false };
    
    console.log('🎥 Starting video call setup for class:', classId);
    
    try {
      // Step 1: Join video call
      console.log('1️⃣ Joining video call...');
      socket.emit('join_video_call', { classId });
      
      // Step 2: Wait for video_call_ready
      const readyData = await createEventPromise(
        socket,
        'video_call_ready',
        'video_call_error',
        20000
      );
      
      console.log('2️⃣ Video call ready, initializing device...');
      
      // Step 3: Initialize device
      const { rtpCapabilities } = readyData as { rtpCapabilities: any };
      const deviceInitialized = await initializeDevice(rtpCapabilities);
      if (!deviceInitialized) {
        throw new Error('Failed to initialize device');
      }
      
      // Step 4: Set RTP capabilities and wait for transports
      console.log('3️⃣ Setting RTP capabilities...');
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

      console.log('4️⃣ Creating transports...');

      // Step 5: Create transports
      await Promise.all([
        createSendTransport(transports.sendTransport),
        createReceiveTransport(transports.recvTransport)
      ]);
      
      console.log('5️⃣ Starting local media and producing...');
      
      // Step 6: Start local stream and produce media
      await startLocalStream();
      await produceMedia();
      
      setConnectionState(ConnectionState.CONNECTED);
      clearError();
      console.log('✅ Video call setup complete - Ready to communicate!');
      
    } catch (error) {
      console.error('❌ Error during video call setup:', error);
      const errorMessage = (typeof error === 'object' && error !== null && 'message' in error)
        ? (error as any).message
        : 'Failed to establish video call';
      setErrorWithType('NETWORK', errorMessage, true, error);
      setConnectionState(ConnectionState.FAILED);
    }
  }, [socket, isConnected, classId, connectionState, initializeDevice, createSendTransport, createReceiveTransport, startLocalStream, produceMedia]);

  const leaveVideoCall = useCallback(() => {
    console.log('👋 Leaving video call...');
    
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

  // Socket event handlers with proper stream management
  useEffect(() => {
    if (!socket) return;
    
    const handleClassJoined = (data: any) => {
      console.log('🏫 Class joined successfully:', data);
      hasJoinedClassRef.current = true;
      setHasJoinedClass(true);
    };
    
    const handleExistingProducers = (producers: Array<{ 
      producerId: string, 
      kind: 'audio' | 'video', 
      producerSocketId: string, 
      producerName: string 
    }>) => {
      console.log('📡 Received existing producers:', producers.length);
      setTimeout(() => {
        producers.forEach((producer, index) => {
          if (producer.producerSocketId !== socket.id) {
            if (transportReadyRef.current.recv) {
              setTimeout(() => {
                consumeRemoteMedia(producer.producerId, producer.producerSocketId, producer.producerName, producer.kind);
              }, index * 500);
            } else {
              pendingProducersRef.current.push(producer);
            }
          }
        });
      }, 1000);
    };
    
    const handleNewProducer = (data: { 
      producerId: string, 
      kind: 'audio' | 'video', 
      producerSocketId: string, 
      producerName: string 
    }) => {
      console.log('🆕 New producer available:', data.kind, 'from', data.producerName);
      if (data.producerSocketId !== socket.id) {
        if (transportReadyRef.current.recv) {
          setTimeout(() => {
            consumeRemoteMedia(data.producerId, data.producerSocketId, data.producerName, data.kind);
          }, 500);
        } else {
          pendingProducersRef.current.push(data);
        }
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
          
          // Remove tracks from stream
          const newStream = new MediaStream();
          peer.stream.getTracks().forEach(track => {
            if (track.kind !== data.kind && track.readyState === 'live') {
              newStream.addTrack(track);
            }
          });
          peer.stream = newStream;
          
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
  
  // Retry connection function
  const retryConnection = useCallback(() => {
    if (connectionState === ConnectionState.FAILED || connectionState === ConnectionState.DISCONNECTED) {
      isInitializedRef.current = false;
      hasJoinedClassRef.current = false;
      setHasJoinedClass(false);
      transportReadyRef.current = { send: false, recv: false };
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
  }
}