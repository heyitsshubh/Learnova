/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { useSocket } from "../Components/Contexts/SocketContext";
import { fetchTurnCredentials } from "../services/meet";

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
  testNetworkConnectivity: () => Promise<void>;
  createEmergencyTransport: () => Promise<void>;
  refreshIceServersAndReconnect: () => Promise<void>;
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
// Moved inside useMediasoup to avoid top-level hook usage error

// Helper to get fresh ICE servers (TURN/STUN)
const getFreshIceServers = async (): Promise<RTCIceServer[]> => {
  try {
    const turnCredentials = await fetchTurnCredentials();
    if (turnCredentials && turnCredentials.urls) {
      return [
        {
          urls: turnCredentials.urls,
          username: turnCredentials.username,
          credential: turnCredentials.credential
        }
      ];
    }
  } catch (error) {
    console.warn('Failed to fetch TURN credentials, using default STUN:', error);
  }
  // fallback to default STUN
  return [{ urls: 'stun:stun.l.google.com:19302' }];
};

export function useMediasoup(classId: string, userId?: string, token?: string): UseMediasoupReturn {
  const { socket, isConnected } = useSocket();

  // MediaSoup refs
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const producersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());
  const pendingProducersRef = useRef<Array<{ producerId: string, producerSocketId: string, producerName: string, kind: 'audio' | 'video' }>>([]);
  const pendingConsumersRef = useRef<Set<string>>(new Set());

  // State management
  const [peers, setPeers] = useState<Peer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [error, setError] = useState<MediasoupError | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
const [hasJoinedClass, setHasJoinedClass] = useState(false);
const hasJoinedClassRef = useRef<boolean>(false);
const transportReadyRef = useRef<{ send: boolean; recv: boolean }>({ send: false, recv: false });
const isInitializedRef = useRef<boolean>(false);

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

  const createSendTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

      if (sendTransportRef.current && !sendTransportRef.current.closed) {
        console.log('✅ Send transport already exists');
        return sendTransportRef.current;
      }

      const freshIceServers = await getFreshIceServers();
      console.log("Using fresh ICE servers for send transport:", freshIceServers);

      console.log('🚛 Creating send transport...');

      const sendTransport = deviceRef.current.createSendTransport({
        id: transportParams.id,
        iceParameters: transportParams.iceParameters,
        iceCandidates: transportParams.iceCandidates,
        dtlsParameters: transportParams.dtlsParameters,
        sctpParameters: transportParams.sctpParameters,
        iceServers: freshIceServers,
        iceTransportPolicy: 'relay',
        additionalSettings: {}
      });

      sendTransport.on('icegatheringstatechange', (iceGatheringState) => {
        console.log('🧊 Send transport ICE gathering state:', iceGatheringState);
        if (iceGatheringState === 'complete') {
          console.log('✅ ICE gathering complete for send transport');
        }
      });

      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log('🔗 Send transport connect event - ICE should be connected now');
          console.log('📊 Transport connection state before connect:', sendTransport.connectionState);

          socket?.emit('connect_transport', {
            transportId: sendTransport.id,
            dtlsParameters,
            direction: 'send'
          });

          console.log('📤 Waiting for server to confirm transport connection...');

          const response = await createEventPromise(
            socket,
            'transport_connected',
            'transport_connect_error',
            20000,
            (data) => data.transportId === sendTransport.id && data.direction === 'send'
          );

          console.log('✅ Server confirmed send transport connection:', response);
          callback();
        } catch (error) {
          console.error('❌ Send transport connect failed:', error);
          errback(error as Error);
        }
      });

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
      console.log('✅ Send transport created with fresh ICE servers');
      return sendTransport;
    } catch (error) {
      console.error('Error creating send transport:', error);
      setErrorWithType('TRANSPORT', 'Failed to create send transport', true, error);
      throw error;
    }
  }, [socket, getFreshIceServers]);

  // Enhanced consumer creation and peer management
  // (Removed duplicate empty declaration of consumeRemoteMedia)

  // Enhanced consumer creation and peer management
  // (Removed duplicate declaration of consumeRemoteMedia)

  // (Duplicate 'consumeRemoteMedia' declaration removed)

  // Enhanced consumer creation and peer management
  const consumeRemoteMedia = useCallback(async (
    producerId: string,
    producerSocketId: string,
    producerName: string,
    kind: 'audio' | 'video'
  ) => {
    const logPrefix = `[CONSUME-${kind.toUpperCase()}]`;
    console.log(`${logPrefix} 🎯 Starting consumption for producer ${producerId} from ${producerName}`);

    try {
      if (!socket) {
        console.error(`${logPrefix} ❌ No socket connection`);
        return;
      }
      if (!recvTransportRef.current || recvTransportRef.current.closed) {
        console.error(`${logPrefix} ❌ No receive transport available`);
        return;
      }
      if (!deviceRef.current) {
        console.error(`${logPrefix} ❌ No device available`);
        return;
      }

      const existingConsumer = Array.from(consumersRef.current.values())
        .find(consumer => consumer.producerId === producerId);

      if (existingConsumer) {
        console.warn(`${logPrefix} ⚠️ Already consuming producer ${producerId}`);
        return;
      }

      if (pendingConsumersRef.current.has(producerId)) {
        console.warn(`${logPrefix} ⚠️ Already requesting consumer for producer ${producerId}`);
        return;
      }
      pendingConsumersRef.current.add(producerId);

      console.log(`${logPrefix} 📤 Sending consume request to server...`);
      console.log(`${logPrefix} 📋 RTP Capabilities available:`, !!deviceRef.current.rtpCapabilities);

      socket.emit('start_consuming', {
        producerId,
        consumerRtpCapabilities: deviceRef.current.rtpCapabilities
      });

      console.log(`${logPrefix} ⏳ Waiting for server response...`);

      try {
        const consumerData = await Promise.race([
          createEventPromise(
            socket,
            'consumer_created',
            'consumer_creation_failed',
            15000,
            (data) => {
              console.log(`${logPrefix} 📨 Received response:`, data);
              return data.producerId === producerId;
            }
          ),
          new Promise((_, reject) => {
            const failHandler = (data: any) => {
              if (data.producerId === producerId) {
                socket.off('consumer_creation_failed', failHandler);
                reject(new Error(`Consumer creation failed: ${data.reason || data.error || 'Unknown error'}`));
              }
            };
            socket.on('consumer_creation_failed', failHandler);
            setTimeout(() => {
              socket.off('consumer_creation_failed', failHandler);
            }, 15000);
          })
        ]);

        const typedConsumerData = consumerData as {
          consumerId: string;
          rtpParameters: any;
          kind: string;
          paused?: boolean;
          producerPeer?: { socketId: string; userName: string; userId: string };
        };

        console.log(`${logPrefix} ✅ Server created consumer:`, {
          consumerId: typedConsumerData.consumerId,
          kind: typedConsumerData.kind,
          paused: typedConsumerData.paused
        });

        const consumer = await recvTransportRef.current.consume({
          id: typedConsumerData.consumerId,
          producerId,
          kind: kind as mediasoupClient.types.MediaKind,
          rtpParameters: typedConsumerData.rtpParameters
        });

        consumersRef.current.set(consumer.id, consumer);

        if (consumer.paused) {
          console.log(`${logPrefix} ▶️ Resuming paused consumer...`);
          await consumer.resume();
        }

        if (!consumer.track) {
          console.error(`${logPrefix} ❌ Consumer has no track!`);
          return;
        }
        if (consumer.track.readyState !== 'live') {
          console.warn(`${logPrefix} ⚠️ Consumer track is not live:`, consumer.track.readyState);
        }

        setPeers(prevPeers => {
          const existingPeerIndex = prevPeers.findIndex(p => p.id === producerSocketId);
          const newPeers = [...prevPeers];

          if (existingPeerIndex >= 0) {
            const existingPeer = { ...newPeers[existingPeerIndex] };
            existingPeer.consumers = new Map(existingPeer.consumers);
            existingPeer.consumers.set(consumer.id, consumer);

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
              trackIds.add(consumer.track.id);
            }

            existingPeer.stream = newStream;
            if (kind === 'video') {
              existingPeer.isVideoEnabled = true;
            } else if (kind === 'audio') {
              existingPeer.isAudioEnabled = true;
            }
            newPeers[existingPeerIndex] = existingPeer;
          } else {
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
            newPeers.push(newPeer);
          }
          return newPeers;
        });
consumer.on('trackended', () => {
  consumersRef.current.delete(consumer.id);
  setPeers(prevPeers => {
    const peerIndex = prevPeers.findIndex(p => p.id === producerSocketId);
    if (peerIndex >= 0) {
      const updatedPeers = [...prevPeers];
      const peer = { ...updatedPeers[peerIndex] };
      peer.isVideoEnabled = false;
      // Remove ended track from stream
      const newStream = new MediaStream();
      peer.stream.getTracks().forEach(track => {
        if (track.kind !== 'video' || track.readyState === 'live') {
          newStream.addTrack(track);
        }
      });
      peer.stream = newStream;
      updatedPeers[peerIndex] = peer;
      return updatedPeers;
    }
    return prevPeers;
  });
});

        consumer.on('transportclose', () => {
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
        });

      } catch (consumerError) {
        const errorMsg = typeof consumerError === 'object' && consumerError !== null && 'message' in consumerError
          ? (consumerError as any).message
          : String(consumerError);
        setErrorWithType('CONSUMER', `Failed to consume ${kind} from ${producerName}: ${errorMsg}`, true, consumerError);
      }

    } catch (error) {
      setErrorWithType('CONSUMER', `Unexpected error consuming ${kind}`, true, error);
    } finally {
      pendingConsumersRef.current.delete(producerId);
    }
  }, [socket, setErrorWithType]);

  const createReceiveTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');
  
      if (recvTransportRef.current && !recvTransportRef.current.closed) {
        console.log('✅ Receive transport already exists');
        return recvTransportRef.current;
      }
  
      const freshIceServers = await getFreshIceServers();
      console.log("Using fresh ICE servers for receive transport:", freshIceServers);
  
      console.log('📡 Creating receive transport...');
  
      const recvTransport = deviceRef.current.createRecvTransport({
        id: transportParams.id,
        iceParameters: transportParams.iceParameters,
        iceCandidates: transportParams.iceCandidates,
        dtlsParameters: transportParams.dtlsParameters,
        sctpParameters: transportParams.sctpParameters,
        iceServers: freshIceServers,
        iceTransportPolicy: 'relay',
        additionalSettings: {}
      });
  
      recvTransport.on('icegatheringstatechange', (iceGatheringState) => {
        console.log('🧊 Receive transport ICE gathering state:', iceGatheringState);
        if (iceGatheringState === 'complete') {
          console.log('✅ ICE gathering complete for receive transport');
        }
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
          // Process any pending producers
          if (pendingProducersRef.current.length > 0) {
            console.log('Pending producers:', pendingProducersRef.current);
            pendingProducersRef.current.forEach(producer => {
              console.log('Consuming pending producer:', producer);
              consumeRemoteMedia(producer.producerId, producer.producerSocketId, producer.producerName, producer.kind);
            });
            pendingProducersRef.current = [];
          }
        } else if (state === 'failed' || state === 'disconnected') {
          transportReadyRef.current.recv = false;
          setErrorWithType('TRANSPORT', 'Receive transport connection failed', true);
        }
      });
  
      recvTransportRef.current = recvTransport;
      console.log('✅ Receive transport created with fresh ICE servers');
      return recvTransport;
    } catch (error) {
      console.error('Error creating receive transport:', error);
      setErrorWithType('TRANSPORT', 'Failed to create receive transport', true, error);
      throw error;
    }
  }, [socket, consumeRemoteMedia]);

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

    try {
      if (videoTrack && !producersRef.current.has('video')) {
        console.log('📹 Producing video...');
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

      if (audioTrack && !producersRef.current.has('audio')) {
        console.log('🎤 Producing audio...');
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
      transportReadyRef.current.send = true;

    } catch (error) {
      console.error('Error producing media:', error);
      setErrorWithType('PRODUCER', 'Failed to produce media', true, error);
      throw error;
    }
  }, []);



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

    transportReadyRef.current = { send: false, recv: false };

    console.log('🎥 Starting video call setup for class:', classId);

    try {
      console.log('1️⃣ Joining video call...');
      socket.emit('join_video_call', { classId });

      const readyData = await createEventPromise(
        socket,
        'video_call_ready',
        'video_call_error',
        20000
      );

      console.log('2️⃣ Video call ready, initializing device...');

      const { rtpCapabilities } = readyData as { rtpCapabilities: any };
      const deviceInitialized = await initializeDevice(rtpCapabilities);
      if (!deviceInitialized) {
        throw new Error('Failed to initialize device');
      }

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

      await Promise.all([
        createSendTransport(transports.sendTransport),
        createReceiveTransport(transports.recvTransport)
      ]);

      console.log('5️⃣ Starting local media and producing...');

      await startLocalStream();
      await produceMedia();

      setConnectionState(ConnectionState.CONNECTED);
      clearError();
      console.log('✅ Video call setup complete - Ready to communicate!');

      setTimeout(() => {
        console.log('6️⃣ Requesting existing producers...');
        socket.emit('get_existing_producers');
      }, 1000);

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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
    }

    producersRef.current.forEach((producer, kind) => {
      if (!producer.closed) {
        producer.close();
        console.log(`Closed ${kind} producer`);
      }
    });
    producersRef.current.clear();

    consumersRef.current.forEach(consumer => {
      if (!consumer.closed) {
        consumer.close();
      }
    });
    consumersRef.current.clear();

    if (sendTransportRef.current && !sendTransportRef.current.closed) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }

    if (recvTransportRef.current && !recvTransportRef.current.closed) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }

    deviceRef.current = null;

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
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log(`🎤 Audio ${audioTrack.enabled ? 'enabled' : 'disabled'} (local track)`);
      }
    }
  }, []);

  // Enhanced socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleClassJoined = (data: any) => {
      console.log('🏫 Class joined successfully:', data);
      hasJoinedClassRef.current = true;
      setHasJoinedClass(true);
    };

    // Enhanced existing producers handler
    const handleExistingProducersEnhanced = (producers: Array<{
      producerId: string,
      kind: 'audio' | 'video',
      producerSocketId: string,
      producerName: string
    }>) => {
      console.log('🎯 EXISTING PRODUCERS EVENT RECEIVED');
      console.log('📊 Total producers:', producers.length);
      console.log('📋 Producers:', producers);
      console.log('🔧 Transport ready:', transportReadyRef.current);
      console.log('📱 Device ready:', !!deviceRef.current);
      console.log('🔌 Socket connected:', socket.connected);

      if (producers.length === 0) {
        console.log('ℹ️ No existing producers to consume');
        return;
      }

      const remoteProducers = producers.filter(p => p.producerSocketId !== socket.id);
      console.log('🌐 Remote producers to consume:', remoteProducers.length);

      if (remoteProducers.length === 0) {
        console.log('ℹ️ No remote producers to consume (all are own producers)');
        return;
      }

      remoteProducers.forEach((producer, index) => {
        const delay = index * 300;
        console.log(`⏰ Scheduling consumption of ${producer.kind} producer ${producer.producerId} in ${delay}ms`);

        setTimeout(() => {
          console.log(`🚀 Starting consumption of ${producer.kind} from ${producer.producerName}`);
          consumeRemoteMedia(producer.producerId, producer.producerSocketId, producer.producerName, producer.kind);
        }, delay);
      });
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

      const consumersToClose = Array.from(consumersRef.current.entries())
        .filter(([_, consumer]) => consumer.producerId === data.producerId);

      consumersToClose.forEach(([consumerId, consumer]) => {
        if (!consumer.closed) {
          consumer.close();
        }
        consumersRef.current.delete(consumerId);
      });

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
      if (error.code?.includes('VIDEO') || error.code?.includes('TRANSPORT') || error.code?.includes('CONSUMER')) {
        const errorType = error.code.includes('VIDEO') ? 'NETWORK' :
          error.code.includes('TRANSPORT') ? 'TRANSPORT' :
            error.code.includes('CONSUMER') ? 'CONSUMER' : 'NETWORK';
        setErrorWithType(errorType, error.message || 'Video call error occurred', true, error);
      }
    };

    socket.on('class_joined', handleClassJoined);
    socket.on('existing_producers', handleExistingProducersEnhanced);
    socket.on('new_producer', handleNewProducer);
    socket.on('peer_disconnected', handlePeerDisconnected);
    socket.on('user_left_video', handleUserLeftVideo);
    socket.on('producer_closed', handleProducerClosed);
    socket.on('error', handleError);

    return () => {
      socket.off('class_joined', handleClassJoined);
      socket.off('existing_producers', handleExistingProducersEnhanced);
      socket.off('new_producer', handleNewProducer);
      socket.off('peer_disconnected', handlePeerDisconnected);
      socket.off('user_left_video', handleUserLeftVideo);
      socket.off('producer_closed', handleProducerClosed);
      socket.off('error', handleError);
    };
  }, [socket, consumeRemoteMedia]);

  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        leaveVideoCall();
      }
    };
  }, [leaveVideoCall]);

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

  useEffect(() => {
    console.log('🔄 Peers updated:', peers.length);
    peers.forEach((peer, index) => {
      console.log(`Peer ${index + 1}:`, {
        id: peer.id,
        name: peer.name,
        videoTracks: peer.stream.getVideoTracks().map(track => ({
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState
        })),
        audioTracks: peer.stream.getAudioTracks().map(track => ({
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState
        })),
        isVideoEnabled: peer.isVideoEnabled,
        isAudioEnabled: peer.isAudioEnabled,
        consumers: Array.from(peer.consumers.keys())
      });
    });
  }, [peers]);

  const refreshIceServersAndReconnect = useCallback(async () => {
    console.log('🔄 Refreshing ICE servers and reconnecting...');
    try {
      if (sendTransportRef.current && !sendTransportRef.current.closed) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }
      if (recvTransportRef.current && !recvTransportRef.current.closed) {
        recvTransportRef.current.close();
        recvTransportRef.current = null;
      }
      transportReadyRef.current = { send: false, recv: false };
      socket?.emit('request_transport_refresh');
    } catch (error) {
      console.error('Error refreshing ICE servers:', error);
    }
  }, [socket]);

  const testNetworkConnectivity = async () => {
    console.log('🧪 Testing network connectivity...');
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      let stunWorking = false;
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate:', event.candidate.type, event.candidate.protocol);
          if (event.candidate.type === 'srflx') {
            stunWorking = true;
            console.log('✅ STUN is working - found server reflexive candidate');
          }
        }
      };
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          if (!stunWorking) {
            console.log('❌ STUN is blocked - you need TURN servers');
          }
          pc.close();
        }
      };
      pc.createDataChannel('test');
      await pc.setLocalDescription(await pc.createOffer());
      setTimeout(() => pc.close(), 10000);
    } catch (error) {
      console.error('Network test failed:', error);
    }
  };

  const createEmergencyTransport = async () => {
    if (!deviceRef.current || !socket) return;
    const transportParams = {};
    // You may need to provide the required arguments here or handle them appropriately
    // Example: If you want to use current refs and state, pass them in
    // await createEmergencyTransport(deviceRef, transportParams, socket, setErrorWithType);
  };

  // Add isVideoCallReady and isConnecting variables
  const isVideoCallReady = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

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
    hasJoinedClass,
    testNetworkConnectivity,
    createEmergencyTransport,
    refreshIceServersAndReconnect
  };
}