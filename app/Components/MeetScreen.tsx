"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMediasoup } from "../hooks/useMediasoup";
import { 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVideo, 
  FaVideoSlash, 
  FaPhoneSlash,
  FaExpand,
  FaCompress,
  FaUsers,
  FaCog
} from "react-icons/fa";

interface MeetScreenProps {
  classId: string;
}

export default function MeetScreen({ classId }: MeetScreenProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role') || 'participant';
  
  const {
    startLocalStream,
    joinVideoCall,
    leaveVideoCall,
    peers,
    localStreamRef,
    isVideoCallReady,
    isConnecting,
    error
  } = useMediasoup(classId);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localStreamStarted, setLocalStreamStarted] = useState(false);

  // Initialize local stream and join call
  useEffect(() => {
    const initializeCall = async () => {
      try {
        console.log('🚀 Initializing video call...');
        
        // Start local stream first
        const stream = await startLocalStream();
        setLocalStreamStarted(true);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join the video call
        joinVideoCall();
        
      } catch (error) {
        console.error('❌ Failed to initialize call:', error);
      }
    };

    initializeCall();

    // Cleanup on unmount
    return () => {
      leaveVideoCall();
    };
  }, [startLocalStream, joinVideoCall, leaveVideoCall]);

  // Handle video toggle
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Handle audio toggle
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Handle leave call
  const handleLeaveCall = () => {
    leaveVideoCall();
    router.back(); // Go back to previous page
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Loading state
  if (isConnecting && !isVideoCallReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">
            {localStreamStarted ? 'Connecting to video call...' : 'Starting camera...'}
          </h2>
          <p className="text-gray-400">Please wait while we set up your video call</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4"></div>
          <h2 className="text-xl font-semibold mb-2 text-red-400">Connection Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleLeaveCall}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalParticipants = peers.length + (localStreamStarted ? 1 : 0);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 shadow-lg">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">
            {role === 'host' ? 'Teaching Session' : 'Learning Session'}
          </h1>
          <span className="text-sm text-gray-400">Class ID: {classId}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-400">
            <FaUsers className="mr-2" />
            {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className={`h-full grid gap-4 ${
          totalParticipants <= 1 ? 'grid-cols-1' :
          totalParticipants <= 4 ? 'grid-cols-2' :
          totalParticipants <= 9 ? 'grid-cols-3' : 'grid-cols-4'
        }`}>
          {/* Local Video */}
          {localStreamStarted && (
            <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local Video Overlay */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">You {role === 'host' ? '(Host)' : ''}</span>
              </div>
              
              {/* Video Disabled Overlay */}
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <FaVideoSlash className="text-4xl text-gray-400 mb-2 mx-auto" />
                    <p className="text-gray-300">Camera Off</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remote Videos */}
          {peers.map((peer) => (
            <div key={peer.id} className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <video
                autoPlay
                playsInline
                ref={(video) => {
                  if (video && peer.stream) {
                    video.srcObject = peer.stream;
                  }
                }}
                className="w-full h-full object-cover"
              />
              
              {/* Remote Video Overlay */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">{peer.name || `Peer ${peer.id.slice(-4)}`}</span>
              </div>
              
              {/* No Video Overlay */}
              {(!peer.stream || peer.stream.getVideoTracks().length === 0 || !peer.stream.getVideoTracks()[0]?.enabled) && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="text-xl font-bold">
                        {peer.name ? peer.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{peer.name || 'Unknown User'}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty slots for visual balance */}
          {Array.from({ length: Math.max(0, 4 - totalParticipants) }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-gray-800 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FaUsers className="text-2xl mb-2 mx-auto opacity-50" />
                <p className="text-sm">Waiting for participants...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-6 bg-gray-800">
        <div className="flex items-center justify-center space-x-6">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full font-medium transition-all duration-200 ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full font-medium transition-all duration-200 ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
          </button>

          {/* Settings (placeholder) */}
          <button
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all duration-200"
            title="Settings"
          >
            <FaCog size={20} />
          </button>

          {/* Leave Call */}
          <button
            onClick={handleLeaveCall}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-all duration-200 flex items-center space-x-2"
            title="Leave call"
          >
            <FaPhoneSlash size={20} />
            <span>Leave</span>
          </button>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-400">
          {isVideoCallReady && (
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Connected
            </span>
          )}
          {!isAudioEnabled && <span>Microphone off</span>}
          {!isVideoEnabled && <span>Camera off</span>}
        </div>
      </div>
    </div>
  );
}
