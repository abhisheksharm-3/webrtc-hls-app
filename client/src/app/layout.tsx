import type { Metadata, Viewport } from "next";
import { cn } from "@/lib/utils";
import { fontSans, fontSerif, fontMono } from "@/lib/fonts";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  // Use a template for page titles for better SEO and consistency
  title: {
    default: "Relay | Next-Gen WebRTC & HLS Streaming",
    template: "%s | Relay",
  },
  description:
    "Experience ultra-low latency streaming with Relay. A professional platform leveraging WebRTC and HLS for unlimited scalability.",
  metadataBase: new URL("https://relaystreaming.vercel.app"),

  // Add keywords and author info
  keywords: [
    "webrtc",
    "hls",
    "live streaming",
    "relay",
    "broadcasting",
    "real-time",
    "video",
  ],
  authors: [{ name: "Relay", url: "https://relaystreaming.vercel.app" }],

  // Open Graph metadata for social sharing
  openGraph: {
    title: "Relay | Next-Gen WebRTC & HLS Streaming",
    description: "Ultra-low latency streaming with WebRTC and HLS.",
    url: "https://relaystreaming.vercel.app",
    siteName: "Relay",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Relay Logo and Tagline",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter card metadata
  twitter: {
    card: "summary_large_image",
    title: "Relay | Next-Gen WebRTC & HLS Streaming",
    description: "Ultra-low latency streaming with WebRTC and HLS.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          fontSans.variable,
          fontSerif.variable,
          fontMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
