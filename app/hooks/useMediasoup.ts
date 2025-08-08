/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const [peers, setPeers] = useState<Peer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isVideoCallReady, setIsVideoCallReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Create Send Transport
  const createSendTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

      const sendTransport = deviceRef.current.createSendTransport(transportParams);
      
      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          socket?.emit('connect_transport', {
            transportId: sendTransport.id,
            dtlsParameters,
            direction: 'send'
          });

          // Wait for transport_connected event
          const connectHandler = (data: any) => {
            if (data.transportId === sendTransport.id && data.direction === 'send') {
              socket?.off('transport_connected', connectHandler);
              callback();
            }
          };
          socket?.on('transport_connected', connectHandler);

          // Set timeout for connection
          setTimeout(() => {
            socket?.off('transport_connected', connectHandler);
            errback(new Error('Transport connection timeout'));
          }, 10000);
        } catch (error) {
          console.error('Error connecting send transport:', error);
          errback(error);
        }
      });

      sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          socket?.emit('start_producing', { kind, rtpParameters });

          const produceHandler = (data: any) => {
            if (data.kind === kind) {
              socket?.off('producer_created', produceHandler);
              callback({ id: data.producerId });
            }
          };
          socket?.on('producer_created', produceHandler);

          setTimeout(() => {
            socket?.off('producer_created', produceHandler);
            errback(new Error('Producer creation timeout'));
          }, 10000);
        } catch (error) {
          console.error('Error producing:', error);
          errback(error);
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

  // Create Receive Transport
  const createReceiveTransport = useCallback(async (transportParams: any) => {
    try {
      if (!deviceRef.current) throw new Error('Device not initialized');

      const recvTransport = deviceRef.current.createRecvTransport(transportParams);
      
      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          socket?.emit('connect_transport', {
            transportId: recvTransport.id,
            dtlsParameters,
            direction: 'recv'
          });

          const connectHandler = (data: any) => {
            if (data.transportId === recvTransport.id && data.direction === 'recv') {
              socket?.off('transport_connected', connectHandler);
              callback();
            }
          };
          socket?.on('transport_connected', connectHandler);

          setTimeout(() => {
            socket?.off('transport_connected', connectHandler);
            errback(new Error('Transport connection timeout'));
          }, 10000);
        } catch (error) {
          console.error('Error connecting receive transport:', error);
          errback(error);
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

  // Start Local Media Stream
  const startLocalStream = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      localStreamRef.current = stream;
      console.log('Local stream started');
      return stream;
    } catch (error) {
      console.error('Error starting local stream:', error);
      setError('Failed to access camera/microphone');
      throw error;
    }
  }, []);

  // Produce Local Media
  const produceMedia = useCallback(async () => {
    try {
      if (!sendTransportRef.current || !localStreamRef.current) return;

      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const audioTrack = localStreamRef.current.getAudioTracks()[0];

      if (videoTrack) {
        const videoProducer = await sendTransportRef.current.produce({ track: videoTrack });
        producersRef.current.set('video', videoProducer);
        console.log('Video producer created');
      }

      if (audioTrack) {
        const audioProducer = await sendTransportRef.current.produce({ track: audioTrack });
        producersRef.current.set('audio', audioProducer);
        console.log('Audio producer created');
      }
    } catch (error) {
      console.error('Error producing media:', error);
      setError('Failed to share media');
    }
  }, []);

  // Consume Remote Media
  const consumeRemoteMedia = useCallback(async (producerId: string, producerSocketId: string, producerName: string, kind: string) => {
    try {
      if (!recvTransportRef.current || !deviceRef.current) return;

      // Check if we can consume this producer
      const canConsume = deviceRef.current.canConsume({
        producerId,
        rtpCapabilities: deviceRef.current.rtpCapabilities
      });

      if (!canConsume) {
        console.warn('Cannot consume producer:', producerId);
        return;
      }

      socket?.emit('start_consuming', { producerId });

      const consumerHandler = async (data: any) => {
        if (data.producerId === producerId) {
          socket?.off('consumer_created', consumerHandler);

          try {
            const consumer = await recvTransportRef.current!.consume({
              id: data.consumerId,
              producerId: data.producerId,
              kind: data.kind,
              rtpParameters: data.rtpParameters
            });

            // Resume the consumer
            socket?.emit('resume_consumer', { consumerId: consumer.id });

            const stream = new MediaStream([consumer.track]);

            setPeers(prevPeers => {
              const existingPeerIndex = prevPeers.findIndex(p => p.id === producerSocketId);
              
              if (existingPeerIndex >= 0) {
                // Update existing peer
                const updatedPeers = [...prevPeers];
                const existingPeer = updatedPeers[existingPeerIndex];
                
                // Add new track to existing stream
                if (consumer.track.kind === 'video') {
                  // Replace video track
                  const videoTracks = existingPeer.stream.getVideoTracks();
                  videoTracks.forEach(track => existingPeer.stream.removeTrack(track));
                  existingPeer.stream.addTrack(consumer.track);
                } else if (consumer.track.kind === 'audio') {
                  // Replace audio track
                  const audioTracks = existingPeer.stream.getAudioTracks();
                  audioTracks.forEach(track => existingPeer.stream.removeTrack(track));
                  existingPeer.stream.addTrack(consumer.track);
                }
                
                existingPeer.consumers.set(consumer.id, consumer);
                return updatedPeers;
              } else {
                // Create new peer
                const newPeer: Peer = {
                  id: producerSocketId,
                  name: producerName,
                  stream: stream,
                  consumers: new Map([[consumer.id, consumer]])
                };
                return [...prevPeers, newPeer];
              }
            });

            console.log(`Consumer created for ${kind} from ${producerName}`);
          } catch (error) {
            console.error('Error creating consumer:', error);
          }
        }
      };

      socket?.on('consumer_created', consumerHandler);

      setTimeout(() => {
        socket?.off('consumer_created', consumerHandler);
      }, 10000);

    } catch (error) {
      console.error('Error consuming remote media:', error);
    }
  }, [socket]);

  // Join Video Call
  const joinVideoCall = useCallback(() => {
    if (!socket || !isConnected) {
      setError('Socket not connected');
      return;
    }

    setIsConnecting(true);
    clearError();
    console.log('🎥 Joining video call for class:', classId);
    
    socket.emit('join_video_call', { classId });
  }, [socket, isConnected, classId]);

  // Leave Video Call
  const leaveVideoCall = useCallback(() => {
    if (socket) {
      socket.emit('leave_video_call');
    }

    // Clean up local resources
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close producers
    producersRef.current.forEach(producer => {
      if (!producer.closed) producer.close();
    });
    producersRef.current.clear();

    // Close transports
    if (sendTransportRef.current && !sendTransportRef.current.closed) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }

    if (recvTransportRef.current && !recvTransportRef.current.closed) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }

    // Clear peers
    setPeers([]);
    setIsVideoCallReady(false);
    setIsConnecting(false);
    clearError();

    console.log('👋 Left video call');
  }, [socket]);

  // Socket Event Handlers
  useEffect(() => {
    if (!socket) return;

    // Video call ready - device initialization
    socket.on('video_call_ready', async (data: { rtpCapabilities: any }) => {
      console.log('📱 Video call ready, initializing device...');
      
      try {
        const success = await initializeDevice(data.rtpCapabilities);
        if (success && deviceRef.current) {
          // Send RTP capabilities to server
          socket.emit('set_rtp_capabilities', {
            rtpCapabilities: deviceRef.current.rtpCapabilities
          });
        }
      } catch (error) {
        console.error('Error initializing device:', error);
        setError('Failed to initialize video call');
        setIsConnecting(false);
      }
    });

    // Transports created
    socket.on('transports_created', async (data: { sendTransport: any; recvTransport: any }) => {
      console.log('Transports created, setting up...');
      
      try {
        await createSendTransport(data.sendTransport);
        await createReceiveTransport(data.recvTransport);
        
        setIsVideoCallReady(true);
        setIsConnecting(false);
        
        // Auto-produce local media after transports are ready
        await produceMedia();
        
        console.log('Video call setup complete');
      } catch (error) {
        console.error('Error setting up transports:', error);
        setError('Failed to setup video call');
        setIsConnecting(false);
      }
    });

    // New producer available
    socket.on('new_producer_available', (data: { 
      producerId: string; 
      kind: string; 
      producerSocketId: string; 
      producerName: string;
    }) => {
      console.log('New producer available:', data.kind, 'from', data.producerName);
      consumeRemoteMedia(data.producerId, data.producerSocketId, data.producerName, data.kind);
    });

    // Video call left
    socket.on('video_call_left', () => {
      console.log('Video call left confirmation');
      setIsVideoCallReady(false);
      setIsConnecting(false);
    });

    // Error handling
    socket.on('error', (error: { message: string; code: string }) => {
      console.error('Socket error:', error);
      setError(error.message || 'An error occurred');
      setIsConnecting(false);
    });

    return () => {
      socket.off('video_call_ready');
      socket.off('transports_created');
      socket.off('new_producer_available');
      socket.off('video_call_left');
      socket.off('transport_connected');
      socket.off('producer_created');
      socket.off('consumer_created');
      socket.off('consumer_resumed');
      socket.off('error');
    };
  }, [socket, initializeDevice, createSendTransport, createReceiveTransport, produceMedia, consumeRemoteMedia]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVideoCall();
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
