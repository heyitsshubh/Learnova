'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useParticipants,
  ConnectionStateToast,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { joinMeeting } from '../services/meet';

type MeetScreenProps = {
  meetingId?: string;
  classId?: string;
  userId?: string;
  token?: string;
};

const MeetScreen: React.FC<MeetScreenProps> = ({ meetingId, classId, userId, token: providedToken }) => {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!meetingId) {
      setError('Missing meeting ID.');
      setLoading(false);
      return;
    }
    try {
      const data = await joinMeeting(meetingId);
      setToken(data.accessToken);
      setServerUrl(data.livekitUrl);
      setUserRole(data.userRole);
    } catch (err) {
      console.error('Failed to join meeting:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (err as any)?.response?.data?.message || 'Failed to join the meeting. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400">Joining meeting...</p>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white gap-4">
        <p className="text-red-400">{error || 'Could not join the meeting.'}</p>
        <button
          onClick={fetchToken}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      video={true}
      audio={true}
      data-lk-theme="default"
      style={{ height: '100vh', backgroundColor: '#111827' }}
      onDisconnected={() => {
        window.location.href = `/classroom/${classId}`;
      }}
    >
      <MeetingHeader userRole={userRole} />
      <MeetingGrid />
      <RoomAudioRenderer />
      <ControlBar controls={{ chat: false, screenShare: true, camera: true, microphone: true, leave: true }} />
      <ConnectionStateToast />
    </LiveKitRoom>
  );
};

const MeetingHeader: React.FC<{ userRole: string | null }> = ({ userRole }) => {
  const participants = useParticipants();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 text-white">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">Class Meeting</h1>
        {userRole && (
          <span className="text-xs px-2 py-1 bg-blue-600 rounded-md uppercase tracking-wide">
            {userRole}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-300">
        {participants.length} participant{participants.length !== 1 ? 's' : ''}
      </div>
    </header>
  );
};

const MeetingGrid: React.FC = () => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - 128px)' }}>
      <ParticipantTile />
    </GridLayout>
  );
};

export default MeetScreen;

