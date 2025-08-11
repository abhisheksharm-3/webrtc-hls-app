"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Cast,
  Settings,
  Copy,
  CheckCircle,
  Video,
  Mic,
} from 'lucide-react';
import { StreamSidebarProps } from '@/lib/types/ui-types';
import { Participant } from '@relay-app/shared';

// --- Helper Functions & Child Components ---

/**
 * @description A reusable component for an information field with a copy button.
 */
const CopyableInfoField = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => console.error('Failed to copy:', err));
  };

  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <code className="text-sm font-mono p-2 bg-secondary/50 rounded-md flex-1 truncate">
          {value}
        </code>
        <Button onClick={handleCopy} size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0">
          <span className="sr-only">Copy {label}</span>
          {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

/**
 * @description Renders a single participant in the list.
 */
const ParticipantItem = ({ p, selfId, userRole }: { p: Participant; selfId?: string; userRole: 'host' | 'guest' | 'viewer' }) => {
  const getParticipantName = () => {
    if (p.id === selfId) return `You (${userRole === 'host' ? 'Host' : 'Guest'})`;
    return p.isHost ? 'Host' : 'Guest';
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-xs bg-primary/20">{getParticipantName().charAt(0)}</AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium truncate">{getParticipantName()}</p>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {p.hasVideo && <Video className="h-4 w-4" />}
        {p.hasAudio && <Mic className="h-4 w-4" />}
      </div>
    </div>
  );
};

/**
 * @description Displays the list of all participants in the stream.
 */
const ParticipantList = ({ participants, selfId, userRole }: Pick<StreamSidebarProps, 'participants' | 'selfId' | 'userRole'>) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        Participants ({participants.length})
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {participants.length > 0 ? (
        participants.map((p) => <ParticipantItem key={p.id} p={p} selfId={selfId} userRole={userRole} />)
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Waiting for participants...</p>
      )}
    </CardContent>
  </Card>
);

/**
 * @description Displays information and actions related to HLS broadcasting.
 */
const BroadcastCard = ({ hlsUrl, userRole }: Pick<StreamSidebarProps, 'hlsUrl' | 'userRole'>) => {
  if (userRole !== 'host' && !hlsUrl) return null; // Hide card if not host and HLS is off

  const watchUrl = hlsUrl ? `${window.location.origin}/watch/${hlsUrl.split('/').slice(-2)[0]}` : '';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cast className="w-5 h-5 text-primary" />
          Broadcast
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hlsUrl && watchUrl ? (
          <CopyableInfoField label="Viewer Watch URL" value={watchUrl} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            {userRole === 'host' ? "HLS broadcast is off" : "Broadcast not active"}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * @description Displays general session information like room code and user role.
 */
const SessionInfoCard = ({ roomCode, userRole }: Pick<StreamSidebarProps, 'roomCode' | 'userRole'>) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        Session Info
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <CopyableInfoField label="Room Code" value={roomCode} />
      <div>
        <Label className="text-xs text-muted-foreground">Your Role</Label>
        <div className="mt-1">
          <Badge variant="outline" className="capitalize">{userRole}</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);


// --- Main Sidebar Component ---

/**
 * @description The main sidebar for the streaming interface, displaying participants,
 * broadcast info, and session details.
 */
export function StreamSidebar(props: StreamSidebarProps) {
  return (
    <aside className="hidden lg:block w-80 border-l bg-background/95 backdrop-blur-sm">
      <div className="h-full overflow-y-auto p-4 space-y-6">
        <ParticipantList {...props} />
        <BroadcastCard {...props} />
        <SessionInfoCard {...props} />
      </div>
    </aside>
  );
}