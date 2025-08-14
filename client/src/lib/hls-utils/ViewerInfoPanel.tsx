"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Signal, Users } from 'lucide-react';

/**
 * Sidebar panel displaying stream info and viewer guidelines.
 */
export const ViewerInfoPanel = ({ roomCode, onLeave }: { roomCode: string; onLeave: () => void; }) => (
  <div className="lg:col-span-1 space-y-6">
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Signal className="h-4 w-4" />
        Stream Info
      </h3>
      <div className="font-medium text-muted-foreground mb-1">Room Code</div>
      <div className="font-mono bg-secondary px-2 py-1 rounded w-full truncate">
        {roomCode}
      </div>
    </Card>
    <Card className="p-4 bg-secondary/30">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Users className="h-4 w-4" />
        Viewer Mode
      </h3>
      <div className="text-sm text-muted-foreground space-y-2">
        <p>You are watching as a viewer. Your mic and camera are off.</p>
        <p>Enjoy the show!</p>
      </div>
      <Button variant="outline" size="sm" onClick={onLeave} className="w-full mt-4">
        Leave Stream
      </Button>
    </Card>
  </div>
);