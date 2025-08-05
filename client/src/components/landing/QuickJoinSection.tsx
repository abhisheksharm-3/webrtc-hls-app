import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, ArrowRight } from 'lucide-react';

interface QuickJoinSectionProps {
  roomId: string;
  setRoomId: (value: string) => void;
  onJoinRoom: () => void;
}

export function QuickJoinSection({ roomId, setRoomId, onJoinRoom }: QuickJoinSectionProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onJoinRoom();
    }
  };

  return (
    <section className="border-y border-border/40 bg-muted/30 py-16">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold">Already have a room code?</h2>
              <p className="text-muted-foreground">
                Join an existing stream quickly with your room code
              </p>
            </div>
            
            <div className="mx-auto flex max-w-md gap-3">
              <Input
                placeholder="Enter room code..."
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-11"
              />
              <Button 
                onClick={onJoinRoom} 
                disabled={!roomId.trim()}
                className="group h-11 px-6"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Join
                <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Room codes are case-sensitive and usually 9 characters long
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}