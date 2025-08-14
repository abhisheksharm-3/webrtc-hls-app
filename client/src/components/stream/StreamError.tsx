/**
 * @file Renders an error message for the stream page.
 */

import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

/**
 * @typedef {object} StreamErrorProps
 * @property {string} error - The error message to display.
 * @property {() => void} onGoHome - Callback function to handle returning to the home page.
 */
interface StreamErrorProps {
  error: string;
  onGoHome: () => void;
}

/**
 * A component to display when a connection error occurs.
 * @param {StreamErrorProps} props - The component props.
 * @returns {JSX.Element} The rendered error state.
 */
export const StreamError = ({ error, onGoHome }: StreamErrorProps) => (
  <AppLayout>
    <div className="flex items-center justify-center h-screen p-4">
      <Card className="p-6 max-w-md w-full">
        <div className="flex items-center gap-3 text-destructive mb-3">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Connection Failed</h3>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">{error}</p>
        <button
          onClick={onGoHome}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go Back to Home
        </button>
      </Card>
    </div>
  </AppLayout>
);