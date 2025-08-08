import type { Metadata, Viewport } from "next";
import { Onest, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

// 1. Define the fonts with their specific weights and CSS variables

// Sans-serif for body text and general UI
const onest = Onest({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-sans',
});

// Serif for major headings to add elegance and contrast
const newsreader = Newsreader({
  subsets: ["latin"],
  display: 'swap',
  weight: ["400", "500", "700"], // Include weights you'll use for headings
  variable: '--font-serif',
});

// Monospaced for code, room IDs, or technical labels
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: 'swap',
  weight: ["400", "500"],
  variable: '--font-mono',
});


export const metadata: Metadata = {
  title: "Streamify | Next-Gen WebRTC & HLS Streaming",
  description: "Experience ultra-low latency streaming with Streamify. A professional platform leveraging WebRTC and HLS for unlimited scalability, perfect for creators and enterprises.",
  keywords: ["webrtc", "hls", "live streaming", "streamify", "broadcasting", "real-time", "video"],
  authors: [{ name: "Streamify" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 2. Apply all font variables to the body tag */}
      <body className={`${onest.variable} ${newsreader.variable} ${ibmPlexMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <div className="relative flex min-h-screen flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}