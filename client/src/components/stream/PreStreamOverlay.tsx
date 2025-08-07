import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PreStreamOverlayProps } from '@/lib/types/ui-types';
import { Video, Play, Users, AlertCircle, ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function PreStreamOverlay({ 
  roomCode, 
  userRole, 
  isConnected, 
  onStartStream, 
  onLeaveRoom, 
  participants, 
  error 
}: PreStreamOverlayProps) {
  const [copied, setCopied] = useState(false);
  
  const isHost = userRole === 'host';
  const hasGuest = participants.some(p => !p.isHost);
  const guestCount = participants.filter(p => !p.isHost).length;
  const hostIsStreaming = participants.some(p => p.isHost && p.isStreaming);
  
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={onLeaveRoom}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Connecting..."}
          </Badge>
        </div>

        {/* Main Card */}
        <Card className="p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 mb-6 mx-auto">
            <Video className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl font-bold mb-3">
            {isHost ? "Ready to Stream" : "Joined as Guest"}
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            {!isConnected 
              ? "Connecting to room..." 
              : isHost 
                ? hasGuest 
                  ? `Your guest has arrived! ${guestCount} participant${guestCount > 1 ? 's' : ''} ready.`
                  : "Share your room code with your guest to get started."
                : hostIsStreaming
                  ? "Host is streaming! You'll join automatically."
                  : "You're connected! Wait for the host to start the stream."
            }
          </p>

          {/* Room Code Section */}
          <Card className="p-4 mb-8 bg-secondary/20">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-sm font-medium text-muted-foreground mb-1">Room Code</div>
                <div className="font-mono text-2xl font-bold">{roomCode}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyRoomCode}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Participants */}
          {participants.length > 0 && (
            <Card className="p-4 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                <span className="font-medium">Participants ({participants.length})</span>
              </div>
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div key={participant.id} className="flex items-center justify-between text-sm">
                    <span>
                      {participant.isHost ? "Host" : `Guest ${index}`}
                    </span>
                    <Badge variant="secondary">
                      {participant.isStreaming ? "Ready" : "Joined"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="p-4 mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </Card>
          )}

          {/* Action Button */}
          {isHost ? (
            <Button
              onClick={onStartStream}
              disabled={!isConnected}
              size="lg"
              className="h-14 px-8 text-lg font-semibold group cursor-pointer transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)]"
            >
              <Play className="w-6 h-6 mr-3 transition-transform duration-300 group-hover:scale-110" />
              {hasGuest ? "Start Live Podcast" : "Start Stream"}
            </Button>
          ) : hostIsStreaming ? (
            <Button
              onClick={onStartStream}
              disabled={!isConnected}
              size="lg"
              className="h-14 px-8 text-lg font-semibold group cursor-pointer transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)]"
            >
              <Play className="w-6 h-6 mr-3 transition-transform duration-300 group-hover:scale-110" />
              Join Live Stream
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Waiting for host to start the stream...
              </p>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 pt-6 border-t text-xs text-muted-foreground">
            <p>
              {isHost 
                ? "Share the room code with your guest to invite them to the podcast."
                : "You'll automatically join the stream when the host starts broadcasting."
              }
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}