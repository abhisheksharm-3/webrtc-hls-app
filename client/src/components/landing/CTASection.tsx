"use client";

import { useRoomActions } from "@/hooks/useRoomActions";
import { stats } from "@/lib/config/landing-page-config";
import { Button } from "@/components/ui/button";
import { Video, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";

// --- Style Constants ---
// By defining class strings here, we make the JSX below much cleaner.
const createRoomButtonStyles =
  "group h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]";
const watchStreamsButtonStyles =
  "h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:scale-105";

/**
 * A single statistic item for display in the CTA section.
 * @param props - The component props.
 * @returns {JSX.Element}
 */
export const StatItem = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => (
  <div className="px-4 text-center sm:px-8">
    <div className="font-mono text-3xl font-bold tracking-tighter sm:text-4xl">
      {value}
    </div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

/**
 * A call-to-action section for the landing page, encouraging users to start streaming.
 */
export const CTASection = () => {
  const { handleCreateRoom } = useRoomActions();

  return (
    <section className="relative py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)]"
      />

      <div className="px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background/80 to-background/80 backdrop-blur-xl border border-white/10 px-8 py-16 text-center sm:px-16">
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 blur-3xl"
            aria-hidden="true"
          >
            <div className="aspect-[1155/678] w-[48rem] bg-gradient-to-tr from-primary/30 to-purple-500/30 opacity-20" />
          </div>

          <div className="relative mx-auto max-w-3xl space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Ready to Start Streaming?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Join thousands of creators using our platform for professional
                live broadcasting and real-time communication.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={handleCreateRoom}
                size="lg"
                className={createRoomButtonStyles}
              >
                <Video className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                Create Room Now
                <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className={watchStreamsButtonStyles}
              >
                <Link href="/watch">
                  <Eye className="mr-3 h-6 w-6" />
                  Watch Live Streams
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center divide-x divide-white/10 pt-8">
              {stats.map((stat) => (
                <StatItem
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
