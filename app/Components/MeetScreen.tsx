import React, { useEffect, useRef, useState } from "react";
import { useMediasoup, ConnectionState } from "../hooks/useMediasoup";

type MeetScreenProps = {
  classId: string;
  userId: string;
  token: string;
};

const MeetScreen: React.FC<MeetScreenProps> = ({ classId }) => {
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
    isAudioEnabled
  } = useMediasoup(classId);

  const [meetingDuration, setMeetingDuration] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const meetingStartTimeRef = useRef<Date | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Attach local video stream
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [localStreamRef.current]);

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

  // Error display
  if (error && !isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2 text-red-300">
            {error.type === 'PERMISSION' ? 'Permission Required' : 'Connection Error'}
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
                  {isConnecting ? 'Joining Meeting...' : 'Ready to Join'}
                </h2>
                {isConnecting && (
                  <div className="mb-4">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-400 mt-2">{getConnectionStatusText()}</p>
                  </div>
                )}
                {!isConnecting && (
                  <button
                    onClick={joinVideoCall}
                    disabled={isConnecting}
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
                  muted 
                  playsInline 
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
                <div key={peer.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(el) => {
                      if (el && peer.stream) {
                        el.srcObject = peer.stream;
                      }
                    }}
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
                    {isVideoEnabled ? '📹' : '📹❌'}
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
    </div>
  );
};

export default MeetScreen;
