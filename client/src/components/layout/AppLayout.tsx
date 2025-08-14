import { cn } from "@/lib/utils";

/**
 * A basic layout wrapper that provides a consistent background and minimum height.
 * @param {React.PropsWithChildren<{ className?: string }>} props - The component props.
 * @returns {JSX.Element}
 */
export default function AppLayout({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {children}
    </div>
  );
}