// /components/watch/ui/JoinWithCodeDialog.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KeyRound } from 'lucide-react';

export const JoinWithCodeDialog = ({ onJoin }: { onJoin: (code: string) => Promise<boolean>; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!joinCode.trim() || isJoining) return;
    setIsJoining(true);
    setError(null);
    const success = await onJoin(joinCode.trim());
    setIsJoining(false);
    if (success) {
      setIsOpen(false);
      setJoinCode('');
    } else {
      setError('No active stream found for this room code. Make sure the code is correct and the stream is live with HLS enabled.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 text-base bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105">
          <KeyRound className="w-5 h-5 mr-2.5" />Join with Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background/80 border-border/30 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Join a Private Stream</DialogTitle>
          <DialogDescription>Enter the room code provided by the creator.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="room-code" className="font-mono text-sm">Room Code</Label>
          <Input id="room-code" placeholder="e.g., abc-123-xyz" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleJoin()} />
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleJoin} disabled={!joinCode.trim() || isJoining}>
            {isJoining ? "Joining..." : "Join Stream"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};