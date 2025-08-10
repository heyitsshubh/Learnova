// import React, { useEffect, useRef, useState } from "react";
// import { useMediasoup } from "../hooks/useMediasoup"; // adjust path

// interface MeetScreenProps {
//   classId: string;
// }

// const MeetScreen: React.FC<MeetScreenProps> = ({ classId }) => {
//   const {
//     joinVideoCall,
//     leaveVideoCall,
//     toggleVideo,
//     toggleAudio,
//     peers,
//     localStreamRef,
//     isVideoCallReady,
 
//     isVideoEnabled,
//     isAudioEnabled
//   } = useMediasoup(classId);

//   const [showParticipants, setShowParticipants] = useState(false);
//   const [meetingDuration, setMeetingDuration] = useState(0);

//   const meetingStartTimeRef = useRef<Date | null>(null);
//   const localVideoRef = useRef<HTMLVideoElement>(null);

//   // Attach local video stream
//   useEffect(() => {
//     if (localVideoRef.current && localStreamRef.current) {
//       localVideoRef.current.srcObject = localStreamRef.current;
//     }
//   }, [localStreamRef.current]);

//   // Track meeting duration
//   useEffect(() => {
//     let timer: NodeJS.Timeout;
//     if (isVideoCallReady) {
//       meetingStartTimeRef.current = new Date();
//       timer = setInterval(() => {
//         const now = new Date();
//         setMeetingDuration(
//           Math.floor((now.getTime() - meetingStartTimeRef.current!.getTime()) / 1000)
//         );
//       }, 1000);
//     }
//     return () => clearInterval(timer);
//   }, [isVideoCallReady]);

//   const formatDuration = (seconds: number) => {
//     const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
//     const secs = (seconds % 60).toString().padStart(2, "0");
//     return `${mins}:${secs}`;
//   };

//   return (
//     <div>
//       {/* Header */}
//       <header>
//         {isVideoCallReady ? (
//           <button onClick={leaveVideoCall}>Leave Call</button>
//         ) : (
//           <button onClick={joinVideoCall}>Join Call</button>
//         )}
//         <span>{formatDuration(meetingDuration)}</span>
//       </header>

//       {/* Video grid */}
//       <div className="video-grid">
//         {/* Local */}
//         <div>
//           <video ref={localVideoRef} autoPlay muted playsInline />
//           <div>
//             You {isVideoEnabled ? "" : "(Video Off)"}{" "}
//             {isAudioEnabled ? "" : "(Muted)"}
//           </div>
//         </div>

//         {/* Remote */}
//         {peers.map((peer) => (
//           <div key={peer.id}>
//             <video
//               autoPlay
//               playsInline
//               ref={(el) => {
//                 if (el && peer.stream) {
//                   el.srcObject = peer.stream;
//                 }
//               }}
//             />
//             <div>
//               {peer.name}{" "}
//               {!peer.isVideoEnabled && " (Video Off)"}{" "}
//               {!peer.isAudioEnabled && " (Muted)"}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Controls */}
//       <div>
//         <button onClick={toggleVideo}>
//           {isVideoEnabled ? "📹" : "📹❌"}
//         </button>
//         <button onClick={toggleAudio}>
//           {isAudioEnabled ? "🎤" : "🎤❌"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default MeetScreen;
