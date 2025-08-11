"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Play, UserPlus, Users, Eye } from 'lucide-react';
import { JoinModeType, JoinRoomDialogPropsType } from '@/lib/types/ui-types';


// --- Child Components ---

/**
 * @description A selector for choosing how to join a room (participate or watch).
 */
const JoinModeSelector = ({ value, onValueChange }: { value: JoinModeType, onValueChange: (value: JoinModeType) => void }) => (
  <div className="grid gap-3">
    <Label className="font-mono text-sm">Join Mode</Label>
    <RadioGroup value={value} onValueChange={(v) => onValueChange(v as JoinModeType)} className="grid gap-3">
      {/* Participate Option */}
      <Label htmlFor="participate" className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-border/80 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/10 cursor-pointer">
        <RadioGroupItem value="participate" id="participate" />
        <div className="flex-1">
          <div className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-primary" /> Join as Guest</div>
          <p className="text-xs text-muted-foreground mt-1">Participate with video and audio.</p>
        </div>
      </Label>
      {/* Watch Option */}
      <Label htmlFor="watch" className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-border/80 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/10 cursor-pointer">
        <RadioGroupItem value="watch" id="watch" />
        <div className="flex-1">
          <div className="flex items-center gap-2 font-semibold"><Eye className="h-4 w-4 text-primary" /> Watch Only</div>
          <p className="text-xs text-muted-foreground mt-1">Watch the HLS stream without joining.</p>
        </div>
      </Label>
    </RadioGroup>
  </div>
);


// --- Main Dialog Component ---

export function JoinRoomDialog({
  roomId,
  setRoomId,
  onJoinRoom,
  onWatchRoom,
  children,
}: JoinRoomDialogPropsType) {
  const [isOpen, setIsOpen] = useState(false);
  const [joinMode, setJoinMode] = useState<JoinModeType>('participate');

  /**
   * @description Handles the form submission for joining a room.
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevents the default browser page reload
    if (!roomId.trim()) return; // Don't submit if the input is empty

    if (joinMode === 'participate') {
      onJoinRoom();
    } else {
      onWatchRoom();
    }
    setIsOpen(false); // Close dialog on successful submission
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background/80 border-border/30 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-5 w-5 text-primary" />
            Join a Stream Room
          </DialogTitle>
          <DialogDescription>
            Enter the room code and choose how you want to join.
          </DialogDescription>
        </DialogHeader>
        {/* ✅ Using a form for better semantics and accessibility */}
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="room-id" className="font-mono text-sm">Room Code</Label>
            <Input
              id="room-id"
              placeholder="e.g., abc-123-xyz"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="h-12 bg-background/50 border-border/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
          
          {/* ✅ RadioGroup is now its own component */}
          <JoinModeSelector value={joinMode} onValueChange={setJoinMode} />
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!roomId.trim()}>
              <Play className="mr-2 h-4 w-4" />
              Join Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}