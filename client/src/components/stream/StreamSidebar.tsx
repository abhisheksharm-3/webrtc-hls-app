import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Cast, Settings, Copy, Radio } from 'lucide-react';
import { Participant } from '@/lib/types/stream-types';
import { StreamSidebarProps } from '@/lib/types/ui-types';

export function StreamSidebar({ isOpen, onClose, participants, selfId, roomId, isStreaming, isHlsEnabled, hlsUrl, onToggleHLS, onCopy }: StreamSidebarProps) {
  const getParticipantName = (p: Participant) => {
    if (p.id === selfId) return "You (Host)";
    return "Guest";
  };
  
  const hlsWatchUrl = hlsUrl ? `${window.location.origin}/watch?stream=${hlsUrl}` : '';

  return (
    <>
      <aside className={`${isOpen ? "translate-x-0" : "translate-x-full"} xl:translate-x-0 fixed xl:relative inset-y-0 right-0 z-40 w-80 xl:w-96 bg-background/95 xl:bg-transparent backdrop-blur-xl xl:backdrop-blur-none border-l xl:border-l-0 border-border/20 transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="flex-1 overflow-y-auto p-4 xl:p-6 space-y-6">
          {/* Participants Card */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3"><CardTitle className="font-serif text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Participants ({participants.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {participants.length > 0 ? participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9 border border-border/50"><AvatarFallback>{getParticipantName(p).charAt(0)}</AvatarFallback></Avatar>
                    <p className="text-sm font-semibold truncate">{getParticipantName(p)}</p>
                  </div>
                  {p.isStreaming && <span className="flex items-center text-xs text-green-400"><Radio className="w-3 h-3 mr-1" />Live</span>}
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">Waiting for participants...</p>}
            </CardContent>
          </Card>
          
          {/* Broadcast Card */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3"><CardTitle className="font-serif text-lg flex items-center gap-2"><Cast className="w-5 h-5 text-primary" />Broadcast</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
                  <div>
                    <Label className="font-semibold text-sm">HLS Streaming</Label>
                    <p className="text-xs text-muted-foreground">Broadcast to viewers.</p>
                  </div>
                  <Button onClick={onToggleHLS} disabled={!isStreaming} size="sm" variant={isHlsEnabled ? "secondary" : "outline"}>{isHlsEnabled ? "Active" : "Enable"}</Button>
               </div>
               {hlsUrl && (
                 <div className="space-y-2">
                   <Label className="font-mono text-xs uppercase text-muted-foreground">HLS Watch Link</Label>
                   <div className="flex items-center gap-2">
                     <code className="text-xs font-mono break-all p-2 bg-black/20 rounded-md border border-border/50 flex-1">{hlsWatchUrl}</code>
                     <Button onClick={() => onCopy(hlsWatchUrl)} size="icon" variant="ghost"><Copy className="w-4 h-4" /></Button>
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Session Info Card */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3"><CardTitle className="font-serif text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-primary" />Session Info</CardTitle></CardHeader>
            <CardContent>
              <Label className="font-mono text-xs uppercase text-muted-foreground">Room Code</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm font-mono p-3 bg-black/20 rounded-md border border-border/50 flex-1 break-all">{roomId}</code>
                <Button onClick={() => onCopy(roomId)} size="icon" variant="ghost"><Copy className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>
      {/* Mobile overlay */}
      {isOpen && <div className="xl:hidden fixed inset-0 bg-black/50 z-30" onClick={onClose} />}
    </>
  );
}