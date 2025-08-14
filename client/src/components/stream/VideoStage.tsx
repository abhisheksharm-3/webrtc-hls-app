"use client";

import React, { useMemo } from "react";
import { VideoStageProps } from "@/lib/types/ui-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Users, Play } from "lucide-react";
import { Participant } from "@relay-app/shared";
import { cn } from "@/lib/utils";

// --- Child Components (can be moved to separate files) ---

/**
 * @description Displays the mic and video status icons for a participant.
 */
const MediaStatusIcons = React.memo(({ hasAudio, hasVideo }: { hasAudio: boolean; hasVideo: boolean }) => (
    <div className="absolute bottom-3 right-3 z-10 flex gap-1">
        <div className={cn("p-1.5 rounded-full", hasAudio ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
            {hasAudio ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
        </div>
        <div className={cn("p-1.5 rounded-full", hasVideo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
            {hasVideo ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
        </div>
    </div>
));

MediaStatusIcons.displayName = 'MediaStatusIcons';

/**
 * @description A reusable tile for displaying a single participant's video stream.
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
    console.log(`🎬 [VideoTile] Rendering ${isLocal ? 'local' : 'remote'} tile for participant ${participant.id}`);
    
    return (
    <Card className="relative w-full overflow-hidden bg-black border-white/10 shadow-lg min-h-[300px]">
        <video
            ref={videoRef}
            autoPlay
            muted={isLocal}
            playsInline
            controls={false}
            data-local={isLocal}
            className="w-full h-full object-cover cursor-pointer"
            style={{ minHeight: '300px' }}
            title="Click to play if video doesn't start automatically"
            onLoadedMetadata={(e) => {
                console.log(`🎥 [VideoTile] Video metadata loaded for ${isLocal ? 'local' : 'remote'} participant`);
                const video = e.target as HTMLVideoElement;
                if (!isLocal && video.paused) {
                    video.play().catch(err => console.warn('VideoTile autoplay failed:', err));
                }
            }}
            onCanPlay={(e) => {
                console.log(`🎥 [VideoTile] Video can play for ${isLocal ? 'local' : 'remote'} participant`);
                const video = e.target as HTMLVideoElement;
                if (!isLocal && video.paused) {
                    video.play().catch(err => console.warn('VideoTile canplay autoplay failed:', err));
                }
            }}
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
 * @description An overlay shown before the user starts their stream.
 */
const StartStreamOverlay = ({ onStartStream, userRole }: { onStartStream: () => void; userRole: string }) => (
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
            <Button onClick={onStartStream} size="lg" className="group">
                <Play className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                {userRole === 'host' ? 'Start Streaming' : 'Join with Camera'}
            </Button>
        </div>
    </div>
);

/**
 * @description A placeholder card shown when waiting for a remote participant.
 */
const WaitingForParticipantCard = () => (
    <Card className="w-full aspect-video bg-secondary/20 flex items-center justify-center">
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
    const { self, remoteParticipant, hasJoinedStream } = useMemo(() => {
        const selfParticipant = participants.find((p) => p.id === selfId);
        const remote = participants.find((p) => p.id !== selfId && !p.isViewer);
        const joined = selfParticipant && (selfParticipant.hasVideo || selfParticipant.hasAudio);
        
        return {
            self: selfParticipant,
            remoteParticipant: remote,
            hasJoinedStream: joined
        };
    }, [participants, selfId]);

    // Debug logging to help troubleshoot visibility issues (can be removed in production)
    console.log("🎬 [VideoStage] Render state:", {
        participantsCount: participants.length,
        selfId,
        remoteParticipantId: remoteParticipant?.id,
        isStreaming,
        hasJoinedStream,
        showRemoteSlot: (isStreaming || remoteParticipant),
        participants: participants.map(p => ({ id: p.id, hasVideo: p.hasVideo, hasAudio: p.hasAudio, isViewer: p.isViewer }))
    });

    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <div className={cn(
                "grid grid-cols-1 gap-4",
                (isStreaming || remoteParticipant) && remoteParticipant && "md:grid-cols-2"
            )}>
                {/* Local Participant */}
                {self && (
                    <div key={`local-${self.id}`} className="relative">
                        <VideoTile participant={self} videoRef={localVideoRef} isLocal />
                        {!hasJoinedStream && <StartStreamOverlay onStartStream={onStartStream} userRole={userRole} />}
                    </div>
                )}

                {/* Remote Participant or Placeholder */}
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
        </div>
    );
}