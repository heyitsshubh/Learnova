"use client";
import { useEffect, useRef } from "react";
import { useMediasoup } from "../hooks/useMediasoup";

export default function MeetScreen({ classId }: { classId: string }) {
  const {
    startLocalStream,
    peers
  } = useMediasoup(classId);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    (async () => {
      const stream = await startLocalStream();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    })();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-1 grid grid-cols-3 gap-2 p-4">
        <video ref={localVideoRef} autoPlay muted playsInline className="rounded-lg bg-black" />
        {peers.map(peer => (
          <video
            key={peer.id}
            autoPlay
            playsInline
            ref={video => {
              if (video) video.srcObject = peer.stream;
            }}
            className="rounded-lg bg-black"
          />
        ))}
      </div>
      <div className="p-4 flex justify-center gap-4 bg-gray-800">
        <button className="bg-red-500 px-4 py-2 rounded">Leave</button>
      </div>
    </div>
  );
}
