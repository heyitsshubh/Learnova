/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { useMediasoup, ConnectionState } from "../hooks/useMediasoup";

type MeetScreenProps = {
  classId: string;
  userId: string;
  token: string;
};

const MeetScreen: React.FC<MeetScreenProps> = ({ classId, userId, token }) => {
  const {
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
    joinClass,
    isConnected,
    hasJoinedClass
  } = useMediasoup(classId, userId, token);

  const [meetingDuration, setMeetingDuration] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const meetingStartTimeRef = useRef<Date | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 🔥 FIXED: Track remote video refs for better debugging
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Join class automatically when socket connects
  useEffect(() => {
    if (isConnected && !hasJoinedClass) {
      console.log('🔌 Socket connected, joining class...');
      joinClass().catch(error => {
        console.error('Failed to join class on connect:', error);
      });
    }
  }, [joinClass, isConnected, hasJoinedClass]);

  // 🔥 CRITICAL FIX: Better local video attachment
  useEffect(() => {
    const attachLocalVideo = async () => {
      if (localVideoRef.current && localStreamRef.current) {
        try {
          console.log('📹 Attaching local video stream...', {
            streamId: localStreamRef.current.id,
            tracks: localStreamRef.current.getTracks().map(t => `${t.kind}:${t.id}:${t.readyState}`)
          });

          // 🔥 FIX: Always set srcObject first
          localVideoRef.current.srcObject = localStreamRef.current;
          
          // 🔥 FIX: Add metadata loaded handler
          const handleMetadataLoaded = () => {
            console.log('📹 Local video metadata loaded');
            if (localVideoRef.current && localVideoRef.current.paused) {
              localVideoRef.current.play().catch(e => {
                console.warn('Local video autoplay prevented (this is usually fine):', e);
              });
            }
          };

          localVideoRef.current.addEventListener('loadedmetadata', handleMetadataLoaded, { once: true });
          
          // 🔥 FIX: Force load if metadata is already available
          if (localVideoRef.current.readyState >= 1) {
            handleMetadataLoaded();
          }

          console.log('✅ Local video attached successfully');
        } catch (error) {
          console.error('❌ Error attaching local video:', error);
        }
      }
    };

    if (isVideoCallReady && localStreamRef.current) {
      attachLocalVideo();
    }
  }, [localStreamRef.current, isVideoCallReady]);

  // 🔥 CRITICAL FIX: Comprehensive peer video handling
  useEffect(() => {
    console.log('🔄 Peers updated:', peers.length);
    peers.forEach((peer, index) => {
      console.log(`Peer ${index + 1}:`, {
        id: peer.id,
        name: peer.name,
        streamId: peer.stream.id,
        videoTracks: peer.stream.getVideoTracks().length,
        audioTracks: peer.stream.getAudioTracks().length,
        isVideoEnabled: peer.isVideoEnabled,
        isAudioEnabled: peer.isAudioEnabled,
        tracks: peer.stream.getTracks().map((t: MediaStreamTrack) => `${t.kind}:${t.id}:${t.readyState}:${t.enabled}`)
      });
    });
  }, [peers]);

  // Track meeting duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVideoCallReady) {
      meetingStartTimeRef.current = new Date();
      timer = setInterval(() => {
        const now = new Date();
        setMeetingDuration(
          Math.floor((now.getTime() - meetingStartTimeRef.current!.getTime()) / 1000)
        );
      }, 1000);
    } else {
      setMeetingDuration(0);
      meetingStartTimeRef.current = null;
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVideoCallReady]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return 'text-green-500';
      case ConnectionState.CONNECTING:
      case ConnectionState.INITIALIZING:
        return 'text-yellow-500';
      case ConnectionState.RECONNECTING:
        return 'text-orange-500';
      case ConnectionState.FAILED:
      case ConnectionState.DISCONNECTED:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return 'Connected';
      case ConnectionState.CONNECTING:
        return 'Connecting...';
      case ConnectionState.INITIALIZING:
        return 'Initializing...';
      case ConnectionState.RECONNECTING:
        return 'Reconnecting...';
      case ConnectionState.FAILED:
        return 'Connection Failed';
      case ConnectionState.DISCONNECTED:
        return 'Disconnected';
      default:
        return 'Not Connected';
    }
  };

  const handleJoinVideoCall = () => {
    if (!hasJoinedClass) {
      console.warn('Must join class before joining video call');
      return;
    }
    console.log('🎯 Joining video call...');
    joinVideoCall();
  };

  // 🔥 FIXED: Remote video component with better error handling
  const RemoteVideo: React.FC<{ peer: any }> = ({ peer }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (videoRef.current && peer.stream) {
        const videoElement = videoRef.current;
        
        console.log(`🎥 Attaching stream for peer ${peer.name}:`, {
          streamId: peer.stream.id,
          tracks: peer.stream.getTracks().map((t: MediaStreamTrack) => `${t.kind}:${t.id}:${t.readyState}:${t.enabled}`)
        });

        // 🔥 CRITICAL: Set srcObject
        videoElement.srcObject = peer.stream;
        
        // Store ref for debugging
        remoteVideoRefs.current.set(peer.id, videoElement);

        const handleLoadedMetadata = () => {
          console.log(`📹 Remote video metadata loaded for ${peer.name}`);
          if (videoElement.paused) {
            videoElement.play().catch(e => {
              console.warn(`Remote video autoplay prevented for ${peer.name}:`, e);
            });
          }
        };

        const handleCanPlay = () => {
          console.log(`▶️ Remote video can play for ${peer.name}`);
        };

        const handleError = (e: Event) => {
          console.error(`❌ Remote video error for ${peer.name}:`, e);
        };

        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        videoElement.addEventListener('canplay', handleCanPlay, { once: true });
        videoElement.addEventListener('error', handleError);

        // 🔥 FIX: Force load if metadata is already available
        if (videoElement.readyState >= 1) {
          handleLoadedMetadata();
        }

        return () => {
          videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.removeEventListener('canplay', handleCanPlay);
          videoElement.removeEventListener('error', handleError);
          remoteVideoRefs.current.delete(peer.id);
        };
      }
    }, [peer.stream, peer.name, peer.id]);

    return (
      <div key={peer.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
          {peer.name || `User ${peer.id.slice(-4)}`}
          {!peer.isVideoEnabled && " (Video Off)"}
          {!peer.isAudioEnabled && " (Muted)"}
        </div>
        {!peer.isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
          </div>
        )}
      </div>
    );
  };
  peers.forEach(peer => {
  const videoTracks = peer.stream.getVideoTracks();
  console.log(`Peer ${peer.name || peer.id} video tracks:`, videoTracks);
  if (videoTracks.length > 0) {
    console.log(`Track readyState:`, videoTracks[0].readyState); // should be 'live'
  }
});

  // Error display
  if (error && !isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2 text-red-300">
            {error.type === 'PERMISSION' ? 'Permission Required' :
              error.type === 'CLASS_ERROR' ? 'Class Join Required' : 'Connection Error'}
          </h2>
          <p className="text-red-200 mb-4">{error.message}</p>
          <div className="flex gap-2">
            <button
              onClick={clearError}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
            >
              Dismiss
            </button>
            {error.retry && (
              <button
                onClick={retryConnection}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-screen bg-gray-900 text-white ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Class Meeting</h1>
          <div className={`flex items-center gap-2 ${getConnectionStatusColor()}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="text-sm">{getConnectionStatusText()}</span>
          </div>
          {!hasJoinedClass && (
            <div className="text-yellow-500 text-sm">
              Joining class...
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isVideoCallReady && (
            <div className="text-sm text-gray-300">
              Duration: {formatDuration(meetingDuration)}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md text-sm transition-colors"
            >
              Participants ({peers.length + (isVideoCallReady ? 1 : 0)})
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? '🔳' : '⛶'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          {!isVideoCallReady ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">
                  {isConnecting ? 'Joining Meeting...' :
                    !hasJoinedClass ? 'Joining Class...' : 'Ready to Join'}
                </h2>
                {(isConnecting || !hasJoinedClass) && (
                  <div className="mb-4">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-400 mt-2">
                      {!hasJoinedClass ? 'Joining class...' : getConnectionStatusText()}
                    </p>
                  </div>
                )}
                {!isConnecting && hasJoinedClass && (
                  <button
                    onClick={handleJoinVideoCall}
                    disabled={isConnecting || !hasJoinedClass}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-lg transition-colors"
                  >
                    Join Video Call
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full grid gap-4 auto-rows-fr" style={{
              gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(peers.length + 1))}, 1fr)`
            }}>
              {/* Local Video */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted // Local video should be muted to prevent feedback
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
                  You {!isVideoEnabled && "(Video Off)"} {!isAudioEnabled && "(Muted)"}
                </div>
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-2xl">
                      👤
                    </div>
                  </div>
                )}
              </div>

              {/* Remote Videos */}
              {peers.map((peer) => (
                <RemoteVideo key={peer.id} peer={peer} />
              ))}
            </div>
          )}
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
            <h3 className="font-semibold mb-4">Participants</h3>
            <div className="space-y-2">
              {isVideoCallReady && (
                <div className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm">
                    You
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">You</div>
                    <div className="text-xs text-gray-400">Host</div>
                  </div>
                  <div className="flex gap-1">
                    {isVideoEnabled ? '📹' : '📹❌'}F
                    {isAudioEnabled ? '🎤' : '🎤❌'}
                  </div>
                </div>
              )}

              {peers.map((peer) => (
                <div key={peer.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm">
                    {peer.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {peer.name || `User ${peer.id.slice(-4)}`}
                    </div>
                    <div className="text-xs text-gray-400">Participant</div>
                  </div>
                  <div className="flex gap-1">
                    {peer.isVideoEnabled ? '📹' : '📹❌'}
                    {peer.isAudioEnabled ? '🎤' : '🎤❌'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isVideoCallReady && (
        <div className="flex items-center justify-center p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                isVideoEnabled
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? '📹' : '📹❌'}
            </button>

            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors ${
                isAudioEnabled
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioEnabled ? '🎤' : '🎤❌'}
            </button>

            <button
              onClick={leaveVideoCall}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
            >
              Leave Call
            </button>
          </div>
        </div>
      )}

      {/* Connection Status Toast */}
      {connectionState === ConnectionState.RECONNECTING && (
        <div className="fixed top-4 right-4 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            Reconnecting...
          </div>
        </div>
      )}

      {/* 🔥 DEBUG: Add debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 right-4 bg-black/80 text-white p-2 rounded text-xs max-w-sm">
          <div>Connection: {connectionState}</div>
          <div>Class Joined: {hasJoinedClass ? 'Yes' : 'No'}</div>
          <div>Peers: {peers.length}</div>
          <div>Local Stream: {localStreamRef.current ? 'Active' : 'None'}</div>
          <div>Video Ready: {isVideoCallReady ? 'Yes' : 'No'}</div>
          {localStreamRef.current && (
            <div>
              Local Tracks: V:{localStreamRef.current.getVideoTracks().length} A:{localStreamRef.current.getAudioTracks().length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetScreen;
