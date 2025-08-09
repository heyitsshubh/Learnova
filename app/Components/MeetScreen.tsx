"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  FaCog,
  FaExclamationTriangle,
  FaSpinner,
  FaDesktop,
  FaVolumeUp,
  FaVolumeMute
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
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  // const [dominantSpeaker, setDominantSpeaker] = useState<string | null>(null);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  // Auto-retry mechanism
  const handleRetry = useCallback(async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    setRetryAttempt(prev => prev + 1);
    
    try {
      console.log(`Retry attempt ${retryAttempt + 1}`);
      
      // Clean up existing connection
      leaveVideoCall();
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Restart the connection process
      const stream = await startLocalStream();
      setLocalStreamStarted(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      joinVideoCall();
      
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [retryAttempt, isRetrying, leaveVideoCall, startLocalStream, joinVideoCall]);

  // Initialize local stream and join call
  useEffect(() => {
    let isMounted = true;
    
    const initializeCall = async () => {
      try {
        console.log('🚀 Initializing video call...');
        
        // Start local stream first
        const stream = await startLocalStream();
        
        if (!isMounted) return;
        
        setLocalStreamStarted(true);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join the video call
        joinVideoCall();
        
      } catch (error) {
        console.error('❌ Failed to initialize call:', error);
        if (isMounted && retryAttempt < 3) {
          // Auto-retry for the first few attempts
          setTimeout(handleRetry, 3000);
        }
      }
    };

    if (!localStreamStarted && !isRetrying) {
      initializeCall();
    }

    return () => {
      isMounted = false;
    };
  }, [startLocalStream, joinVideoCall, localStreamStarted, retryAttempt, handleRetry, isRetrying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVideoCall();
    };
  }, [leaveVideoCall]);

  // Update local video ref when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [localStreamRef.current]);

  // --- FIX: Ensure video element always gets the latest stream ---
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [localStreamRef, localStreamStarted]);
  // -------------------------------------------------------------

  // Handle video toggle
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }, [localStreamRef]);

  // Handle audio toggle
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log(`Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }, [localStreamRef]);

  // Handle leave call
  const handleLeaveCall = useCallback(() => {
    leaveVideoCall();
    router.back();
  }, [leaveVideoCall, router]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Screen sharing (placeholder for future implementation)
  const toggleScreenShare = useCallback(() => {
    // Placeholder for screen sharing functionality
    console.log('Screen share toggle (not implemented)');
    setIsScreenShareEnabled(!isScreenShareEnabled);
  }, [isScreenShareEnabled]);

  // Calculate grid layout based on participant count
  const getGridLayout = (participantCount: number) => {
    if (participantCount <= 1) return "grid-cols-1";
    if (participantCount <= 2) return "grid-cols-1 lg:grid-cols-2";
    if (participantCount <= 4) return "grid-cols-2";
    if (participantCount <= 6) return "grid-cols-2 lg:grid-cols-3";
    return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  const totalParticipants = peers.length + (localStreamStarted ? 1 : 0);

  // Loading state with better UX
  if (isConnecting || isRetrying) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto" />
            {isRetrying && (
              <div className="absolute -top-2 -right-2">
                <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                  {retryAttempt}
                </div>
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {isRetrying 
              ? `Reconnecting... (Attempt ${retryAttempt})`
              : localStreamStarted 
                ? 'Connecting to video call...' 
                : 'Starting camera...'
            }
          </h2>
          <p className="text-gray-400">
            {isRetrying 
              ? 'We\'re working to restore your connection...' 
              : 'Please wait while we set up your video call'
            }
          </p>
          {retryAttempt >= 2 && (
            <button
              onClick={handleRetry}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Retry Now
            </button>
          )}
        </div>
      </div>
    );
  }

  // Error state with retry options
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-6xl mb-4 mx-auto" />
          <h2 className="text-xl font-semibold mb-2 text-red-400">Connection Error</h2>
          <p className="text-gray-400 mb-2">{error}</p>
          
          {retryAttempt > 0 && (
            <p className="text-sm text-gray-500 mb-6">
              Retry attempts: {retryAttempt}/3
            </p>
          )}
          
          <div className="space-x-4">
            <button
              onClick={handleRetry}
              disabled={isRetrying || retryAttempt >= 3}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
            <button
              onClick={handleLeaveCall}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
          
          {retryAttempt >= 3 && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Still having trouble?</p>
              <ul className="text-xs text-gray-400 text-left space-y-1">
                <li>• Check your internet connection</li>
                <li>• Allow camera and microphone permissions</li>
                <li>• Try refreshing the page</li>
                <li>• Use a different browser</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold">
              {role === 'host' ? 'Teaching Session' : 'Learning Session'}
            </h1>
            <span className="text-sm text-gray-400">Class ID: {classId}</span>
          </div>
          
          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isVideoCallReady ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs text-gray-400">
              {isVideoCallReady ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
            <FaUsers className="mr-2" />
            {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors tooltip"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* Enhanced Video Grid */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className={`h-full grid gap-4 ${getGridLayout(totalParticipants)}`}>
          {/* Local Video with enhanced styling */}
          {localStreamStarted && (
            <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700 group">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Enhanced Local Video Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-sm font-medium flex items-center">
                  You {role === 'host' && <span className="ml-2 text-xs bg-blue-500 px-2 py-1 rounded-full">Host</span>}
                </span>
              </div>
              
              {/* Audio/Video Status Indicators */}
              <div className="absolute top-4 right-4 flex space-x-2">
                {!isAudioEnabled && (
                  <div className="bg-red-500 p-2 rounded-full">
                    <FaMicrophoneSlash className="text-xs" />
                  </div>
                )}
                {!isVideoEnabled && (
                  <div className="bg-red-500 p-2 rounded-full">
                    <FaVideoSlash className="text-xs" />
                  </div>
                )}
              </div>
              
              {/* Video Disabled Overlay */}
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <span className="text-2xl font-bold">You</span>
                    </div>
                    <p className="text-gray-300">Camera Off</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Remote Videos */}
          {peers.map((peer) => (
            <div 
              key={peer.id} 
              className={`relative bg-gray-800 rounded-xl overflow-hidden shadow-xl border transition-all duration-300 ${
                // dominantSpeaker === peer.id 
                //   ? 'border-blue-500 border-2 shadow-blue-500/25' 
                //   : 
                'border-gray-700 hover:border-gray-600'
              } group`}
            >
              <video
                autoPlay
                playsInline
                ref={(video) => {
                  if (video && peer.stream) {
                    video.srcObject = peer.stream;
                  }
                }}
               className="w-full h-full object-contain bg-black"
              />
              
              {/* Enhanced Remote Video Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-sm font-medium">
                  {peer.name || `Peer ${peer.id.slice(-4)}`}
                </span>
              </div>
              
              {/* Connection Quality Indicator */}
              <div className="absolute top-4 left-4">
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-1 h-3 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              
              {/* Audio Indicator for Remote Peers */}
              <div className="absolute top-4 right-4">
                {peer.stream && peer.stream.getAudioTracks()[0]?.enabled ? (
                  <FaVolumeUp className="text-green-500" />
                ) : (
                  <FaVolumeMute className="text-red-500" />
                )}
              </div>
              
              {/* No Video Overlay */}
              {(!peer.stream || peer.stream.getVideoTracks().length === 0 || !peer.stream.getVideoTracks()[0]?.enabled) && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 mx-auto shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {peer.name ? peer.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm font-medium">{peer.name || 'Unknown User'}</p>
                    <p className="text-gray-500 text-xs mt-1">Camera off</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Enhanced Empty Slots */}
          {Array.from({ length: Math.max(0, Math.min(6 - totalParticipants, 4)) }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center transition-all duration-300 hover:border-gray-500">
              <div className="text-center text-gray-500">
                <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <FaUsers className="text-xl opacity-50" />
                </div>
                <p className="text-sm font-medium">Waiting for participants...</p>
                <p className="text-xs mt-1 opacity-75">Share the class ID to invite others</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Control Bar */}
      <div className="p-6 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-6">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-gray-700/25'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25'
            }`}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-gray-700/25'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
          </button>

          {/* Screen Share Toggle (Host Only) */}
          {role === 'host' && (
            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg ${
                isScreenShareEnabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25'
                  : 'bg-gray-700 hover:bg-gray-600 text-white shadow-gray-700/25'
              }`}
              title={isScreenShareEnabled ? 'Stop screen share' : 'Share screen'}
            >
              <FaDesktop size={20} />
            </button>
          )}

          {/* Settings */}
          <button
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-gray-700/25"
            title="Settings"
          >
            <FaCog size={20} />
          </button>

          {/* Leave Call */}
          <button
            onClick={handleLeaveCall}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-all duration-200 flex items-center space-x-2 transform hover:scale-105 shadow-lg shadow-red-600/25"
            title="Leave call"
          >
            <FaPhoneSlash size={20} />
            <span>Leave</span>
          </button>
        </div>
        
        {/* Enhanced Status Indicators */}
        <div className="flex items-center justify-center mt-4 space-x-6 text-sm text-gray-400">
          {isVideoCallReady && (
            <span className="flex items-center bg-green-900/50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Connected
            </span>
          )}
          {!isAudioEnabled && (
            <span className="flex items-center bg-red-900/50 px-3 py-1 rounded-full">
              <FaMicrophoneSlash className="mr-2" />
              Microphone off
            </span>
          )}
          {!isVideoEnabled && (
            <span className="flex items-center bg-red-900/50 px-3 py-1 rounded-full">
              <FaVideoSlash className="mr-2" />
              Camera off
            </span>
          )}
          {isScreenShareEnabled && (
            <span className="flex items-center bg-blue-900/50 px-3 py-1 rounded-full">
              <FaDesktop className="mr-2" />
              Sharing screen
            </span>
          )}
        </div>
      </div>
    </div>
  );
}