import { Onest, Newsreader, IBM_Plex_Mono } from "next/font/google";

// Sans-serif for body text and general UI
export const fontSans = Onest({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-sans',
});

// Serif for major headings
export const fontSerif = Newsreader({
  subsets: ["latin"],
  display: 'swap',
  weight: ["400", "500", "700"],
  variable: '--font-serif',
});

// Monospaced for code or technical labels
export const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: 'swap',
  weight: ["400", "500"],
  variable: '--font-mono',
});