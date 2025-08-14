"use client";

import AppLayout from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

/**
 * A loading component displayed while the viewer's session is being established.
 */
export const WatchLoader = () => (
  <AppLayout>
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Joining stream...</p>
      </div>
    </div>
  </AppLayout>
);