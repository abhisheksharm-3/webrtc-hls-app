import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Cast, Settings, Copy, Radio, Eye, CheckCircle } from 'lucide-react';
import { Participant } from '@/lib/types/stream-types';
import { StreamSidebarProps } from '@/lib/types/ui-types';
import { useState } from 'react';

export function StreamSidebar({ 
  roomCode, 
  participants, 
  selfId, 
  userRole, 
  hlsUrl, 
  onCopyToClipboard 
}: StreamSidebarProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  
  const getParticipantName = (p: Participant) => {
    if (p.id === selfId) {
      return `You (${userRole === 'host' ? 'Host' : 'Guest'})`;
    }
    if (p.isHost) return "Host";
    return "Guest";
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await onCopyToClipboard(text);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const watchUrl = hlsUrl ? `${window.location.origin}/watch` : '';

  return (
    <div className="w-80 border-l bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Participants Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Participants ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {participants.length > 0 ? participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {getParticipantName(p).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{getParticipantName(p)}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {p.hasVideo && <span>📹</span>}
                      {p.hasAudio && <span>🎤</span>}
                    </div>
                  </div>
                </div>
                {p.isStreaming && (
                  <Badge variant="secondary" className="text-xs">
                    <Radio className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                )}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Waiting for participants...
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Broadcast Card - Only show for host or when HLS is active */}
        {(userRole === 'host' || hlsUrl) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cast className="w-5 h-5 text-primary" />
                Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hlsUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium text-sm">HLS Streaming</Label>
                      <p className="text-xs text-muted-foreground">Broadcasting to viewers</p>
                    </div>
                    <Badge variant="default" className="bg-green-500/10 text-green-400 border-green-500/30">
                      <Eye className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Watch URL for Viewers
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono break-all p-2 bg-secondary/50 rounded-md flex-1">
                        {watchUrl}
                      </code>
                      <Button
                        onClick={() => handleCopy(watchUrl, 'watch-url')}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        {copiedItem === 'watch-url' ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    {userRole === 'host' 
                      ? "Start streaming to enable HLS broadcast"
                      : "HLS broadcast not active"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Session Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Session Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Room Code</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm font-mono p-2 bg-secondary/50 rounded-md flex-1">
                  {roomCode}
                </code>
                <Button
                  onClick={() => handleCopy(roomCode, 'room-code')}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  {copiedItem === 'room-code' ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">Your Role</Label>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">
                  {userRole}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground space-y-2">
              <p className="font-medium">How it works:</p>
              <ul className="space-y-1 ml-2">
                <li>• Host and guest can stream together</li>
                <li>• Viewers watch via HLS (when enabled)</li>
                <li>• Share the room code to invite others</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}