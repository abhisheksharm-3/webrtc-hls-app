"use client";

import React, { useMemo } from "react";
import { VideoStageProps } from "@/lib/types/ui-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Users, Play } from "lucide-react";
import { Participant } from "@relay-app/shared";
import { cn } from "@/lib/utils";

// --- Child Components ---

/**
 * Displays the mic and video status icons for a participant.
 */
const MediaStatusIcons = React.memo(({ hasAudio, hasVideo }: { hasAudio: boolean; hasVideo: boolean }) => (
  <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur-sm">
    <div className={cn("flex items-center gap-1 text-xs", hasVideo ? "text-green-400" : "text-red-400")}>
      {hasVideo ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
    </div>
    <div className="h-4 w-px bg-white/20" />
    <div className={cn("flex items-center gap-1 text-xs", hasAudio ? "text-green-400" : "text-red-400")}>
      {hasAudio ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
    </div>
  </div>
));
MediaStatusIcons.displayName = 'MediaStatusIcons';

/**
 * A reusable tile for displaying a single participant's video stream.
 */
const VideoTile = React.memo(({
  participant,
  videoRef,
  isLocal = false,
}: {
  participant: Participant;
  videoRef: React.Ref<HTMLVideoElement>;
  isLocal?: boolean;
}) => {
  return (
    <Card className="relative w-full overflow-hidden bg-black border-white/10 shadow-lg aspect-video">
      <video
        ref={videoRef}
        autoPlay={isLocal} // Enable autoplay for local video only
        muted={isLocal}
        playsInline
        controls={false}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-3 left-3 z-10">
        <Badge variant="secondary" className="text-xs bg-black/70 text-white border-white/20">
          {isLocal ? `You (${participant.isHost ? "Host" : "Guest"})` : (participant.isHost ? "Host" : "Guest")}
        </Badge>
      </div>
      <MediaStatusIcons hasAudio={participant.hasAudio} hasVideo={participant.hasVideo} />
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.participant.id === nextProps.participant.id &&
    prevProps.participant.hasVideo === nextProps.participant.hasVideo &&
    prevProps.participant.hasAudio === nextProps.participant.hasAudio &&
    prevProps.participant.isHost === nextProps.participant.isHost &&
    prevProps.isLocal === nextProps.isLocal
  );
});
VideoTile.displayName = 'VideoTile';

/**
 * An overlay shown before the user starts their stream.
 */
const StartStreamOverlay = ({ onStartStream, userRole }: { onStartStream: () => void; userRole: string }) => (
  <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="text-center text-white">
      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
        <Video className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {userRole === 'host' ? 'Ready to Go Live?' : 'Join the Stream'}
      </h3>
      <p className="text-sm text-gray-300 mb-6 max-w-xs">
        {userRole === 'host' ? 'When you start, your camera and mic will be live for everyone.' : 'Your camera and mic will turn on when you join the session.'}
      </p>
      <Button onClick={onStartStream} size="lg" className="group bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300">
        <Play className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
        {userRole === 'host' ? 'Start Streaming' : 'Join with Camera'}
      </Button>
    </div>
  </div>
);

/**
 * A placeholder card shown when waiting for a remote participant.
 */
const WaitingForParticipantCard = () => (
  <Card className="w-full aspect-video bg-secondary/20 flex items-center justify-center border-dashed">
    <div className="text-center text-muted-foreground">
      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p className="text-sm">Waiting for other participant...</p>
    </div>
  </Card>
);

// --- Main VideoStage Component ---

export function VideoStage({
  localVideoRef,
  participants,
  selfId,
  getRemoteVideoRef,
  userRole,
  isStreaming,
  onStartStream,
}: VideoStageProps & { onStartStream: () => void }) {
  const { self, remoteParticipant } = useMemo(() => {
    const selfParticipant = participants.find((p) => p.id === selfId);
    const remote = participants.find((p) => p.id !== selfId && !p.isViewer);
    return { self: selfParticipant, remoteParticipant: remote };
  }, [participants, selfId]);

  // A user is considered to have "joined" if their media is active.
  const hasJoinedStream = self && (self.hasVideo || self.hasAudio);

  return (
    <main className="flex-1 p-4 overflow-y-auto">
      <div className={cn(
        "grid grid-cols-1 gap-4",
        // Use 2 columns if a remote participant exists
        remoteParticipant && "md:grid-cols-2"
      )}>
        {/* Local Participant */}
        {self && (
          <div key={`local-${self.id}`} className="relative">
            <VideoTile participant={self} videoRef={localVideoRef} isLocal />
            {!hasJoinedStream && <StartStreamOverlay onStartStream={onStartStream} userRole={userRole} />}
          </div>
        )}

        {/* Remote Participant or Placeholder */}
        {/* The remote slot is shown if the stream is live OR a remote participant is connecting */}
        {(isStreaming || remoteParticipant) && (
          remoteParticipant ? (
            <VideoTile
              key={`remote-${remoteParticipant.id}`}
              participant={remoteParticipant}
              videoRef={getRemoteVideoRef(remoteParticipant.id)}
            />
          ) : (
            <WaitingForParticipantCard key="waiting" />
          )
        )}
      </div>
    </main>
  );
}
