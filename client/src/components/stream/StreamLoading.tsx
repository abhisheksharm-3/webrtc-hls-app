/**
 * @file Renders a loading indicator for the stream page.
 * @author Your Name
 */

import AppLayout from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

/**
 * A component to display while the stream session is initializing.
 * @returns {JSX.Element} The rendered loading state.
 */
export const StreamLoading = () => (
  <AppLayout>
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Initializing session...</p>
      </div>
    </div>
  </AppLayout>
);