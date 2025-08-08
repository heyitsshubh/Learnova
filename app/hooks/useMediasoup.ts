/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import { useSocket } from "../Components/Contexts/SocketContext";

interface Peer {
  id: string;
  name?: string;
  stream: MediaStream;
}

export function useMediasoup(classId: string) {
  const { socket, isConnected } = useSocket();
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<any>(null);
  const recvTransportRef = useRef<any>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  // --- INIT DEVICE ---
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("joinRoom", { classId });

    socket.on("newPeer", ({ peerId }) => {
      console.log("New peer joined:", peerId);
    });

    return () => {
      socket.emit("leaveRoom", { classId });
      socket.off("newPeer");
    };
  }, [socket, isConnected, classId]);

  const loadDevice = async (routerRtpCapabilities: any) => {
    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities });
    deviceRef.current = device;
  };

  const startLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    return stream;
  };

  const createSendTransport = (params: any) => {
    const transport = deviceRef.current!.createSendTransport(params);

    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      socket?.emit("connectTransport", {
        transportId: transport.id,
        dtlsParameters
      }, (response: any) => {
        if (response.error) {
          errback(response.error);
        } else {
          callback();
        }
      });
    });

    transport.on("produce", ({ kind, rtpParameters }, callback, errback) => {
      socket?.emit("produce", {
        transportId: transport.id,
        kind,
        rtpParameters
      }, ({ id, error }: any) => {
        if (error) {
          errback(error);
        } else {
          callback({ id });
        }
      });
    });

    sendTransportRef.current = transport;
  };

  const createRecvTransport = (params: any) => {
    const transport = deviceRef.current!.createRecvTransport(params);

    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      socket?.emit("connectTransport", {
        transportId: transport.id,
        dtlsParameters
      }, (response: any) => {
        if (response.error) {
          errback(response.error);
        } else {
          callback();
        }
      });
    });

    recvTransportRef.current = transport;
  };

  const consumeTrack = async (producerId: string, peerId: string, name?: string) => {
    socket?.emit("consume", {
      producerId,
      rtpCapabilities: deviceRef.current?.rtpCapabilities
    }, async ({ id, kind, rtpParameters }: { id: string; kind: string; rtpParameters: any }) => {
      const consumer = await recvTransportRef.current!.consume({
        id,
        producerId,
        kind,
        rtpParameters
      });

      const stream = new MediaStream();
      stream.addTrack(consumer.track);

      setPeers(prev => [...prev, { id: peerId, name, stream }]);
    });
  };

  return {
    startLocalStream,
    loadDevice,
    createSendTransport,
    createRecvTransport,
    consumeTrack,
    peers,
    localStreamRef
  };
}
