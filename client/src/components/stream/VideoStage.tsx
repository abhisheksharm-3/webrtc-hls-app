import { VideoStageProps } from '@/lib/types/ui-types';
import { PreStreamOverlay } from './PreStreamOverlay';

export function VideoStage({ isStreaming, localVideoRef, remoteParticipants, getRemoteVideoRef, onStartStreaming, isReady }: VideoStageProps) {
  const VideoCard = ({ children, participantName }: { children: React.ReactNode, participantName: string }) => (
    <div className="relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
      {children}
      {isStreaming && (
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-semibold text-white bg-black/50 rounded-md">{participantName}</span>
        </div>
      )}
    </div>
  );

  if (isStreaming && remoteParticipants.length > 0) {
    // --- Grid View (Host + Guest) ---
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <VideoCard participantName="You (Host)">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </VideoCard>
        {remoteParticipants.slice(0, 1).map((p) => (
          <VideoCard key={p.id} participantName="Guest">
            <video ref={getRemoteVideoRef(p.id)} autoPlay playsInline className="w-full h-full object-cover" />
          </VideoCard>
        ))}
      </div>
    );
  }

  // --- Single Video View (Lobby or Host-only stream) ---
  return (
    <div className="relative w-full h-full max-w-none mx-auto overflow-hidden rounded-xl md:rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
      <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      {!isStreaming && (
        <PreStreamOverlay 
          onStartStreaming={onStartStreaming} 
          isReady={isReady} 
          hasGuest={remoteParticipants.length > 0} 
        />
      )}
    </div>
  );
}