import { VideoStageProps } from "@/lib/types/ui-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Users, Play } from "lucide-react";

// Update the props to accept the onStartStream function
interface UpdatedVideoStageProps extends VideoStageProps {
  onStartStream: () => void;
}

export function VideoStage({
  localVideoRef,
  participants,
  selfId,
  getRemoteVideoRef,
  userRole,
  isStreaming,
  onStartStream,
}: UpdatedVideoStageProps) {
  
  const self = participants.find((p) => p.id === selfId);
  const remoteParticipants = participants.filter((p) => p.id !== selfId && !p.isViewer);
  
  // Check if the 'self' participant has started streaming by checking their media status.
  const hasJoinedStream = self && (self.hasVideo || self.hasAudio);

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className={`grid grid-cols-1 ${isStreaming && remoteParticipants.length > 0 ? 'md:grid-cols-2' : ''} gap-4`}>
        
        <Card className="relative w-full aspect-video overflow-hidden bg-black border-white/10 shadow-2xl">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Show overlay if this user hasn't started their stream yet */}
          {!hasJoinedStream && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {userRole === 'host' ? 'Ready to Go Live?' : 'Join the Stream'}
                </h3>
                <p className="text-sm text-gray-300 mb-6">
                  {userRole === 'host' ? 'When you start, your camera and mic will be live.' : 'Your camera and mic will turn on when you join.'}
                </p>
                {/* ✅ This button is now available to both hosts and guests */}
                <Button onClick={onStartStream} size="lg" className="group">
                  <Play className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                  {userRole === 'host' ? 'Start Streaming' : 'Join with Camera'}
                </Button>
              </div>
            </div>
          )}

          {/* In-Stream UI Elements (only show if this user is streaming) */}
          {hasJoinedStream && self && (
            <>
              <div className="absolute top-3 left-3 z-10">
                <Badge
                  variant="secondary"
                  className="text-xs bg-black/70 text-white border-white/20"
                >
                  You ({self.isHost ? "Host" : "Guest"})
                </Badge>
              </div>
              <div className="absolute bottom-3 right-3 z-10 flex gap-1">
                <div className={`p-1 rounded-full ${self.hasAudio ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {self.hasAudio ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                </div>
                <div className={`p-1 rounded-full ${self.hasVideo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {self.hasVideo ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Remote Participant Card */}
        {isStreaming && (
          <>
            {remoteParticipants.length > 0 ? (
              <Card className="relative w-full aspect-video overflow-hidden bg-black border-white/10 shadow-2xl">
                <video
                  ref={getRemoteVideoRef(remoteParticipants[0].id)}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 z-10">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-black/70 text-white border-white/20"
                  >
                    {remoteParticipants[0].name} ({remoteParticipants[0].isHost ? "Host" : "Guest"})
                  </Badge>
                </div>
                <div className="absolute bottom-3 right-3 z-10 flex gap-1">
                    <div className={`p-1 rounded-full ${remoteParticipants[0].hasAudio ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {remoteParticipants[0].hasAudio ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                    </div>
                    <div className={`p-1 rounded-full ${remoteParticipants[0].hasVideo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {remoteParticipants[0].hasVideo ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                    </div>
                </div>
              </Card>
            ) : (
              <Card className="w-full aspect-video bg-secondary/20 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Waiting for other participant...</p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
