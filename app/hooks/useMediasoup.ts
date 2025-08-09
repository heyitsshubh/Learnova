import { useEffect, useRef, useState, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { useSocket } from "../Components/Contexts/SocketContext";

interface Peer {
  id: string;
  name?: string;
  stream: MediaStream;
  consumers: Map<string, mediasoupClient.types.Consumer>;
}

interface UseMediasoupReturn {
  startLocalStream: () => Promise<MediaStream>;
  joinVideoCall: () => void;
  leaveVideoCall: () => void;
  peers: Peer[];
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  isVideoCallReady: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useMediasoup(classId: string): UseMediasoupReturn {
  const { socket, isConnected } = useSocket();
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const producersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());
  const [peers, setPeers] = useState<Peer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isVideoCallReady, setIsVideoCallReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  const clearError = () => setError(null);

  // Initialize MediaSoup Device
  const initializeDevice = useCallback(async (rtpCapabilities: any) => {
    try {
      if (!deviceRef.current) {
        deviceRef.current = new mediasoupClient.Device();
      }
      
      if (!deviceRef.current.loaded) {
        await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });
        console.log('MediaSoup device loaded successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error loading MediaSoup device:', error);
      setError('Failed to initialize media device');
      return false;
    }
  }, []);

  // Create Send Transport with proper error handling
  const createSendTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

      const sendTransport = deviceRef.current.createSendTransport(transportParams);
      
      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log('Send transport connecting...');
          
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
          console.log(`Producing ${kind}...`);
          
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
        console.log('Send transport connection state:', state);
        if (state === 'failed' || state === 'disconnected') {
          setError('Connection lost - send transport failed');
        }
      });

      sendTransportRef.current = sendTransport;
      console.log('Send transport created successfully');
      return sendTransport;
    } catch (error) {
      console.error('Error creating send transport:', error);
      throw error;
    }
  }, [socket]);

  // Create Receive Transport with proper error handling
  const createReceiveTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

      const recvTransport = deviceRef.current.createRecvTransport(transportParams);
      
      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log('Receive transport connecting...');
          
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
        console.log('Receive transport connection state:', state);
        if (state === 'failed' || state === 'disconnected') {
          setError('Connection lost - receive transport failed');
        }
      });

      recvTransportRef.current = recvTransport;
      console.log('Receive transport created successfully');
      return recvTransport;
    } catch (error) {
      console.error('Error creating receive transport:', error);
      throw error;
    }
  }, [socket]);

  // Start Local Media Stream with better constraints
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
          video: { width: 640, height: 480, frameRate: 15 },
          audio: true
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      localStreamRef.current = stream;
      console.log('Local stream started with tracks:', 
        stream.getVideoTracks().length, 'video,', 
        stream.getAudioTracks().length, 'audio');
      return stream;
    } catch (error) {
      console.error('Error starting local stream:', error);
      setError('Failed to access camera/microphone. Please check permissions.');
      throw error;
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

            console.log('Video producer created successfully');
          } catch (error) {
            console.error('Error creating video producer:', error);
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

            console.log('Audio producer created successfully');
          } catch (error) {
            console.error('Error creating audio producer:', error);
          }
        };
        producePromises.push(produceAudio());
      }

      await Promise.allSettled(producePromises);
    } catch (error) {
      console.error('Error producing media:', error);
      setError('Failed to share media');
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

      console.log(`Starting to consume ${kind} from ${producerName}`);

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

              console.log(`Consumer created successfully for ${kind} from ${producerName}`);
              resolve();
            } catch (error) {
              console.error('Error creating consumer:', error);
              reject(error);
            }
          }
        };

        const errorHandler = (data: any) => {
          if (data.producerId === producerId) {
            clearTimeout(timeout);
            socket?.off('consumer_created', consumerHandler);
            socket?.off('consumer_error', errorHandler);
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
    }
  }, [socket]);

  // Join Video Call with initialization check
  const joinVideoCall = useCallback(() => {
    if (!socket || !isConnected) {
      setError('Socket not connected');
      return;
    }

    if (isInitializedRef.current) {
      console.warn('Video call already initialized');
      return;
    }

    setIsConnecting(true);
    clearError();
    isInitializedRef.current = true;
    console.log('🎥 Joining video call for class:', classId);
    
    socket.emit('join_video_call', { classId });
  }, [socket, isConnected, classId]);

  // Leave Video Call with proper cleanup
  const leaveVideoCall = useCallback(() => {
    console.log('👋 Leaving video call...');
    
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
    setIsVideoCallReady(false);
    setIsConnecting(false);
    isInitializedRef.current = false;
    clearError();

    console.log('Video call cleanup completed');
  }, [socket]);

  // Socket Event Handlers
  useEffect(() => {
    if (!socket) return;

    // Video call ready - device initialization
    const handleVideoCallReady = async (data: { rtpCapabilities: any }) => {
      console.log('📱 Video call ready, initializing device...');
      
      try {
        const success = await initializeDevice(data.rtpCapabilities);
        if (success && deviceRef.current) {
          socket.emit('set_rtp_capabilities', {
            rtpCapabilities: deviceRef.current.rtpCapabilities
          });
        }
      } catch (error) {
        console.error('Error initializing device:', error);
        setError('Failed to initialize video call');
        setIsConnecting(false);
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
        
        setIsVideoCallReady(true);
        setIsConnecting(false);
        
        // Produce local media after transports are ready
        await produceMedia();
        
        console.log('✅ Video call setup complete');
      } catch (error) {
        console.error('Error setting up transports:', error);
        setError('Failed to setup video call transports');
        setIsConnecting(false);
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
      setIsVideoCallReady(false);
      setIsConnecting(false);
    };

    // Error handling
    const handleError = (error: { message: string; code?: string }) => {
      console.error('🚨 Socket error:', error);
      setError(error.message || 'An error occurred');
      setIsConnecting(false);
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
    peers,
    localStreamRef,
    isVideoCallReady,
    isConnecting,
    error
  };
}
