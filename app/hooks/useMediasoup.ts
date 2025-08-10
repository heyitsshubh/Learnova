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
  const pendingConsumersRef = useRef<Set<string>>(new Set());

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

  // Fixed socket promise utility

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
          
          // Wait for transport_connected event
          
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
          
          const response = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Produce timeout')), 10000);
            
            const handler = (data: any) => {
              clearTimeout(timeout);
              if (data.kind === kind) {
                resolve({ id: data.producerId });
              }
            };
            
            socket?.on('producer_created', handler);
            
            // Cleanup listener after timeout
            setTimeout(() => {
              socket?.off('producer_created', handler);
            }, 10000);
          });
          
          callback(response);
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
          
          const response = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connect timeout')), 10000);
            
            const handler = (data: any) => {
              clearTimeout(timeout);
              if (data.transportId === recvTransport.id && data.direction === 'recv') {
                if (data.success) {
                  resolve(data);
                } else {
                  reject(new Error(data.error || 'Connection failed'));
                }
              }
            };
            
            socket?.on('transport_connected', handler);
            
            // Cleanup listener after timeout
            setTimeout(() => {
              socket?.off('transport_connected', handler);
            }, 10000);
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

    try {
      // Produce video track
      if (videoTrack && !producersRef.current.has('video')) {
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
          producersRef.current.delete('video');
          console.log('Video producer transport closed');
        });
        
        videoProducer.on('trackended', () => {
          producersRef.current.delete('video');
          console.log('Video producer track ended');
        });
        
        console.log('✅ Video producer created successfully');
      }

      // Produce audio track
      if (audioTrack && !producersRef.current.has('audio')) {
        const audioProducer = await sendTransportRef.current.produce({ 
          track: audioTrack,
          encodings: [{ maxBitrate: 128000 }]
        });
        
        producersRef.current.set('audio', audioProducer);
        
        audioProducer.on('transportclose', () => {
          producersRef.current.delete('audio');
          console.log('Audio producer transport closed');
        });
        
        audioProducer.on('trackended', () => {
          producersRef.current.delete('audio');
          console.log('Audio producer track ended');
        });
        
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
      
      // Send consume request
      socket?.emit('start_consuming', { producerId });

      // Wait for consumer_created event
      const consumerData = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingConsumersRef.current.delete(producerId);
          reject(new Error('Consumer creation timeout'));
        }, 15000);
        
        const handler = (data: any) => {
          if (data.producerId === producerId) {
            clearTimeout(timeout);
            resolve(data);
          }
        };
        
        socket?.on('consumer_created', handler);
        
        // Cleanup listener after timeout
        setTimeout(() => {
          socket?.off('consumer_created', handler);
        }, 15000);
      });

      const consumer = await recvTransportRef.current.consume({
        id: consumerData.consumerId,
        producerId,
        kind,
        rtpParameters: consumerData.rtpParameters
      });
      
      consumersRef.current.set(consumer.id, consumer);

      // Resume the consumer
      socket?.emit('resume_consumer', { consumerId: consumer.id });

      // Wait for consumer_resumed event
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Consumer resume timeout')), 10000);
        
        const handler = (data: any) => {
          if (data.consumerId === consumer.id) {
            clearTimeout(timeout);
            if (data.success) {
              resolve();
            } else {
              reject(new Error(data.error || 'Failed to resume consumer'));
            }
          }
        };
        
        socket?.once('consumer_resumed', handler);
        
        // Cleanup listener after timeout
        setTimeout(() => {
          socket?.off('consumer_resumed', handler);
        }, 10000);
      });

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
      consumer.on('trackended', () => {
        console.log(`Consumer track ended: ${kind} from ${producerName}`);
        consumersRef.current.delete(consumer.id);
        
        setPeers(prevPeers => {
          const peerIndex = prevPeers.findIndex(p => p.id === producerSocketId);
          if (peerIndex >= 0) {
            const updatedPeers = [...prevPeers];
            const peer = updatedPeers[peerIndex];
            peer.consumers.delete(consumer.id);
            peer.stream.removeTrack(consumer.track);
            
            if (kind === 'video') {
              peer.isVideoEnabled = false;
            } else if (kind === 'audio') {
              peer.isAudioEnabled = false;
            }
            
            return updatedPeers;
          }
          return prevPeers;
        });
      });

      consumer.on('transportclose', () => {
        console.log(`Consumer transport closed: ${kind} from ${producerName}`);
        consumersRef.current.delete(consumer.id);
      });

      pendingConsumersRef.current.delete(producerId);
      console.log(`✅ Consumer created and resumed successfully for ${kind} from ${producerName}`);
      
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
      // Step 1: Join video call
      socket.emit('join_video_call', { classId });
      
      // Step 2: Wait for video_call_ready
      const rtpCapabilities = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Join timeout')), 20000);
        
        const handler = (data: any) => {
          clearTimeout(timeout);
          resolve(data.rtpCapabilities);
        };
        
        socket.once('video_call_ready', handler);
      });
      
      // Step 3: Initialize device
      const deviceInitialized = await initializeDevice(rtpCapabilities);
      if (!deviceInitialized) {
        throw new Error('Failed to initialize device');
      }
      
      // Step 4: Set RTP capabilities and wait for transports
      socket.emit('set_rtp_capabilities', { 
        rtpCapabilities: deviceRef.current!.rtpCapabilities 
      });
      
      const transports = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Transport timeout')), 20000);
        
        const handler = (data: any) => {
          clearTimeout(timeout);
          resolve(data);
        };
        
        socket.once('transports_created', handler);
      });
      
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
      setErrorWithType('NETWORK', 'Failed to establish video call', true, error);
      setConnectionState(ConnectionState.FAILED);
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
    }
  }, [socket]);
  
  // Socket event handlers
  useEffect(() => {
    if (!socket) return;
    
    const handleVideoCallReady = async (data: { rtpCapabilities: any }) => {
      console.log('📱 Video call ready event received');
      // This is handled in joinVideoCall flow
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

    const handlePeerLeftVideo = (data: { peerId: string, peerName: string }) => {
      console.log('📞 Peer left video:', data.peerName);
      setPeers(prevPeers => prevPeers.filter(peer => peer.id !== data.peerId));
    };

    const handleVideoCallLeft = () => {
      console.log('📞 Video call left confirmation');
      setConnectionState(ConnectionState.DISCONNECTED);
    };

    const handleError = (error: { message: string, code?: string }) => {
      console.error('🚨 Socket error:', error);
      if (error.code === 'VIDEO_CALL_ERROR') {
        setErrorWithType('NETWORK', error.message || 'Video call error occurred', true, error);
      } else {
        setErrorWithType('NETWORK', error.message || 'An error occurred', true, error);
      }
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

    // Register event listeners
    socket.on('video_call_ready', handleVideoCallReady);
    socket.on('new_producer_available', handleNewProducer);
    socket.on('peer_disconnected', handlePeerDisconnected);
    socket.on('peer_left_video', handlePeerLeftVideo);
    socket.on('video_call_left', handleVideoCallLeft);
    socket.on('error', handleError);
    socket.on('peer_media_state_changed', handlePeerMediaStateChanged);
    socket.on('user_joined_video', handleUserJoinedVideo);

    return () => {
      socket.off('video_call_ready', handleVideoCallReady);
      socket.off('new_producer_available', handleNewProducer);
      socket.off('peer_disconnected', handlePeerDisconnected);
      socket.off('peer_left_video', handlePeerLeftVideo);
      socket.off('video_call_left', handleVideoCallLeft);
      socket.off('error', handleError);
      socket.off('peer_media_state_changed', handlePeerMediaStateChanged);
      socket.off('user_joined_video', handleUserJoinedVideo);
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
      joinVideoCall();
    }
  }, [connectionState, joinVideoCall]);

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
