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
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
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
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // ms
  maxDelay: 10000, // ms
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

  const retryConnection = useCallback(() => {
    if (connectionState === ConnectionState.FAILED || error) {
      console.log('🔄 Manual retry triggered');
      retryCountRef.current = 0;
      clearError();
      joinVideoCall();
    }
  }, [connectionState, error, joinVideoCall]);

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
      
      scheduleRetry('DEVICE_INIT', async () => {
        await initializeDevice(rtpCapabilities);
      });
      
      return false;
    }
  }, [scheduleRetry]);

  const createSendTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');
      
      if (sendTransportRef.current) {
        return sendTransportRef.current;
      }
      
      const sendTransport = deviceRef.current.createSendTransport(transportParams);
      
      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await socket?.emitWithAck('connect_transport', {
            transportId: sendTransport.id,
            dtlsParameters,
            direction: 'send'
          });
          callback();
        } catch (error) {
          console.error('Error connecting send transport:', error);
          errback(error as Error);
        }
      });
      
      sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
          const { producerId } = await socket?.emitWithAck('start_producing', {
            transportId: sendTransport.id,
            kind,
            rtpParameters,
            appData,
          });
          callback({ id: producerId });
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

      if (recvTransportRef.current) {
        return recvTransportRef.current;
      }

      const recvTransport = deviceRef.current.createRecvTransport(transportParams);
      
      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await socket?.emitWithAck('connect_transport', {
            transportId: recvTransport.id,
            dtlsParameters,
            direction: 'recv'
          });
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
      const constraints = { video: true, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setIsVideoEnabled(stream.getVideoTracks().length > 0);
      setIsAudioEnabled(stream.getAudioTracks().length > 0);
      console.log('📹 Local stream started');
      return stream;
    } catch (error) {
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

    // Produce video track
    if (videoTrack && !producersRef.current.has('video')) {
      try {
        const videoProducer = await sendTransportRef.current.produce({ track: videoTrack, encodings: [{ maxBitrate: 1000000 }] });
        producersRef.current.set('video', videoProducer);
        videoProducer.on('transportclose', () => producersRef.current.delete('video'));
        console.log('✅ Video producer created successfully');
      } catch (error) {
        setErrorWithType('PRODUCER', 'Failed to create video producer', true, error);
      }
    }

    // Produce audio track
    if (audioTrack && !producersRef.current.has('audio')) {
      try {
        const audioProducer = await sendTransportRef.current.produce({ track: audioTrack, encodings: [{ maxBitrate: 1000000 }] });
        producersRef.current.set('audio', audioProducer);
        audioProducer.on('transportclose', () => producersRef.current.delete('audio'));
        console.log('✅ Audio producer created successfully');
      } catch (error) {
        setErrorWithType('PRODUCER', 'Failed to create audio producer', true, error);
      }
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
      
      console.log(`📥 Starting to consume ${kind} from ${producerName}`);
      
      const { consumerId, rtpParameters } = await socket?.emitWithAck('start_consuming', { 
        transportId: recvTransportRef.current.id,
        producerId,
        rtpCapabilities: deviceRef.current.rtpCapabilities
      });

      const consumer = await recvTransportRef.current.consume({
        id: consumerId,
        producerId,
        kind,
        rtpParameters
      });
      
      consumersRef.current.set(consumer.id, consumer);
      socket?.emit('resume_consumer', { consumerId: consumer.id });

      setPeers(prevPeers => {
        let existingPeer = prevPeers.find(p => p.id === producerSocketId);
        
        if (!existingPeer) {
          existingPeer = {
            id: producerSocketId,
            name: producerName,
            stream: new MediaStream(),
            consumers: new Map(),
            isAudioEnabled: false,
            isVideoEnabled: false
          };
          prevPeers = [...prevPeers, existingPeer];
        }

        existingPeer.consumers.set(consumer.id, consumer);
        existingPeer.stream.addTrack(consumer.track);
        
        if (kind === 'video') {
            existingPeer.isVideoEnabled = true;
        } else if (kind === 'audio') {
            existingPeer.isAudioEnabled = true;
        }

        consumer.on('trackended', () => {
          console.log(`Consumer track ended: ${kind} from ${producerName}`);
          if (kind === 'video') {
            existingPeer.isVideoEnabled = false;
          } else if (kind === 'audio') {
            existingPeer.isAudioEnabled = false;
          }
          existingPeer.stream.removeTrack(consumer.track);
          consumersRef.current.delete(consumer.id);
          setPeers([...prevPeers]); // Trigger a re-render
        });
        
        return [...prevPeers];
      });

      console.log(`✅ Consumer created successfully for ${kind} from ${producerName}`);
    } catch (error) {
      console.error('Error consuming remote media:', error);
      setErrorWithType('CONSUMER', `Failed to consume remote media: ${kind}`, true, error);
    }
  }, [socket]);

  const joinVideoCall = useCallback(async () => {
    if (!socket || !isConnected) {
      setErrorWithType('NETWORK', 'Socket not connected', true);
      return;
    }

    if (isInitializedRef.current && connectionState !== ConnectionState.FAILED) {
      console.warn('Video call already initialized');
      return;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setConnectionState(ConnectionState.CONNECTING);
    clearError();
    isInitializedRef.current = true;
    console.log('🎥 Joining video call for class:', classId);
    
    try {
      const { rtpCapabilities } = await socket.emitWithAck('join_video_call', { classId });
      
      await initializeDevice(rtpCapabilities);
      
      const { sendTransport, recvTransport } = await socket.emitWithAck('create_transports');
      
      await Promise.all([
        createSendTransport(sendTransport),
        createReceiveTransport(recvTransport)
      ]);

      await startLocalStream();
      await produceMedia();
      
      setConnectionState(ConnectionState.CONNECTED);
      clearError();
      console.log('✅ Video call setup complete');

    } catch (error) {
      console.error('Error during join_video_call flow:', error);
      setErrorWithType('NETWORK', 'Failed to establish video call', true, error);
    }
  }, [socket, isConnected, classId, connectionState, initializeDevice, createSendTransport, createReceiveTransport, startLocalStream, produceMedia]);

  const leaveVideoCall = useCallback(() => {
    console.log('👋 Leaving video call...');
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (socket) {
      socket.emit('leave_video_call');
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    producersRef.current.forEach(producer => !producer.closed && producer.close());
    producersRef.current.clear();
    
    consumersRef.current.forEach(consumer => !consumer.closed && consumer.close());
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
    retryCountRef.current = 0;
    isRetryingRef.current = false;
    isInitializedRef.current = false;
    clearError();
    console.log('✅ Video call cleanup completed');
  }, [socket]);
  
  const toggleVideo = useCallback(() => {
    const videoProducer = producersRef.current.get('video');
    if (videoProducer) {
        if (videoProducer.paused) {
            videoProducer.resume();
            setIsVideoEnabled(true);
        } else {
            videoProducer.pause();
            setIsVideoEnabled(false);
        }
        socket?.emit('toggle_media', { kind: 'video', paused: videoProducer.paused });
        console.log(`📹 Video ${videoProducer.paused ? 'disabled' : 'enabled'}`);
    }
  }, [socket]);

  const toggleAudio = useCallback(() => {
    const audioProducer = producersRef.current.get('audio');
    if (audioProducer) {
        if (audioProducer.paused) {
            audioProducer.resume();
            setIsAudioEnabled(true);
        } else {
            audioProducer.pause();
            setIsAudioEnabled(false);
        }
        socket?.emit('toggle_media', { kind: 'audio', paused: audioProducer.paused });
        console.log(`🎤 Audio ${audioProducer.paused ? 'disabled' : 'enabled'}`);
    }
  }, [socket]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleVideoCallReady = async (data: { rtpCapabilities: any }) => {
      console.log('📱 Video call ready, initializing device...');
      try {
        const success = await initializeDevice(data.rtpCapabilities);
        if (success && deviceRef.current) {
          socket.emit('set_rtp_capabilities', { rtpCapabilities: deviceRef.current.rtpCapabilities });
          const { sendTransport, recvTransport } = await socket.emitWithAck('create_transports');
          await Promise.all([createSendTransport(sendTransport), createReceiveTransport(recvTransport)]);
          await startLocalStream();
          await produceMedia();
          setConnectionState(ConnectionState.CONNECTED);
          clearError();
        }
      } catch (error) {
        console.error('Error initializing device and transports:', error);
        setErrorWithType('DEVICE_INIT', 'Failed to initialize video call', true, error);
      }
    };
    
    const handleNewProducer = (data: { producerId: string, kind: 'audio' | 'video', producerSocketId: string, producerName: string }) => {
      console.log('🆕 New producer available:', data.kind, 'from', data.producerName);
      if (data.producerSocketId !== socket.id) {
        consumeRemoteMedia(data.producerId, data.producerSocketId, data.producerName, data.kind);
      }
    };
    
    const handlePeerDisconnected = (data: { peerId: string }) => {
      console.log('👋 Peer disconnected:', data.peerId);
      setPeers(prevPeers => prevPeers.filter(peer => peer.id !== data.peerId));
    };

    const handleVideoCallLeft = () => {
      console.log('📞 Video call left confirmation');
      setConnectionState(ConnectionState.DISCONNECTED);
    };

    const handleError = (error: { message: string }) => {
      console.error('🚨 Socket error:', error);
      setErrorWithType('NETWORK', error.message || 'An error occurred', true, error);
    };

    socket.on('video_call_ready', handleVideoCallReady);
    socket.on('new_producer_available', handleNewProducer);
    socket.on('peer_disconnected', handlePeerDisconnected);
    socket.on('video_call_left', handleVideoCallLeft);
    socket.on('error', handleError);

    return () => {
      socket.off('video_call_ready', handleVideoCallReady);
      socket.off('new_producer_available', handleNewProducer);
      socket.off('peer_disconnected', handlePeerDisconnected);
      socket.off('video_call_left', handleVideoCallLeft);
      socket.off('error', handleError);
      
      // Clean up transport-specific listeners
      if (sendTransportRef.current) sendTransportRef.current.removeAllListeners();
      if (recvTransportRef.current) recvTransportRef.current.removeAllListeners();
    };
  }, [socket, initializeDevice, createSendTransport, createReceiveTransport, startLocalStream, produceMedia, consumeRemoteMedia]);

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
    connectionState,
    error,
    retryConnection,
    clearError,
    isVideoEnabled,
    isAudioEnabled,
  };
}
