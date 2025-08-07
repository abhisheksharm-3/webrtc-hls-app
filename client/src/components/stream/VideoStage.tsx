import { VideoStageProps } from '@/lib/types/ui-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Video, VideoOff, Users } from 'lucide-react';

export function VideoStage({ 
  localVideoRef, 
  participants, 
  selfId, 
  getRemoteVideoRef, 
  userRole, 
  isStreaming 
}: VideoStageProps) {
  
  const VideoCard = ({ 
    children, 
    participantName, 
    hasVideo = true,
    hasAudio = true
  }: { 
    children: React.ReactNode; 
    participantName: string;
    hasVideo?: boolean;
    hasAudio?: boolean;
  }) => (
    <Card className="relative w-full h-full overflow-hidden bg-black border-white/10 shadow-2xl">
      {children}
      {isStreaming && (
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="secondary" className="text-xs bg-black/70 text-white border-white/20">
            {participantName}
          </Badge>
        </div>
      )}
      {isStreaming && (
        <div className="absolute bottom-3 right-3 z-10 flex gap-1">
          <div className={`p-1 rounded-full ${hasAudio ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {hasAudio ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
          </div>
          <div className={`p-1 rounded-full ${hasVideo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {hasVideo ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
          </div>
        </div>
      )}
    </Card>
  );

  // Get active participants (excluding viewers)
  const activeParticipants = participants.filter(p => !p.isViewer);
  const self = activeParticipants.find(p => p.id === selfId);
  const remoteParticipants = activeParticipants.filter(p => p.id !== selfId);
  
  // Always show 2 slots when streaming (host + guest)
  if (isStreaming) {
    return (
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          {/* Local Video - Always show yourself */}
          <VideoCard 
            participantName={`You (${userRole === 'host' ? 'Host' : 'Guest'})`}
            hasVideo={self?.hasVideo ?? true}
            hasAudio={self?.hasAudio ?? true}
          >
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover" 
            />
          </VideoCard>
          
          {/* Remote/Other participant slot */}
          {remoteParticipants.length > 0 ? (
            // Show the other participant
            <VideoCard 
              participantName={remoteParticipants[0].isHost ? "Host" : "Guest"}
              hasVideo={remoteParticipants[0].hasVideo}
              hasAudio={remoteParticipants[0].hasAudio}
            >
              <video 
                ref={getRemoteVideoRef(remoteParticipants[0].id)} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
            </VideoCard>
          ) : (
            // Show placeholder for the other participant
            <VideoCard 
              participantName={userRole === 'host' ? "Waiting for Guest" : "Waiting for Host"}
              hasVideo={false}
              hasAudio={false}
            >
              <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {userRole === 'host' 
                      ? "Waiting for guest to join..." 
                      : "Waiting for host..."
                    }
                  </p>
                  <p className="text-xs mt-1">
                    {userRole === 'host' && "Share your room code"}
                  </p>
                </div>
              </div>
            </VideoCard>
          )}
        </div>
      </div>
    );
  }

  // Single video view (pre-stream or solo streaming)
  return (
    <div className="flex-1 p-4">
      <div className="relative w-full h-full max-w-4xl mx-auto">
        <VideoCard 
          participantName={`You (${userRole === 'host' ? 'Host' : 'Guest'})`}
          hasVideo={self?.hasVideo ?? true}
          hasAudio={self?.hasAudio ?? true}
        >
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover" 
          />
          
          {!isStreaming && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Preview Mode</h3>
                <p className="text-sm text-gray-300">
                  {userRole === 'host' 
                    ? "Ready to start your live podcast"
                    : "Waiting for host to start the stream"
                  }
                </p>
              </div>
            </div>
          )}
        </VideoCard>
      </div>
    </div>
  );
}