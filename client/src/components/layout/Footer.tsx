"use client";

import { Separator } from "@/components/ui/separator";
import { Video, Eye, Settings, Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";
import { cva } from "class-variance-authority";
import React from "react";
import { FooterLink } from "@/lib/types/ui-types";

// --- Data ---
const footerLinks: Record<string, FooterLink[]> = {
  platform: [
    { name: "Start Streaming", href: "#", icon: Video },
    { name: "Watch Streams", href: "/watch", icon: Eye },
    { name: "Features", href: "#features", icon: Settings },
  ],
  technology: [
    { name: "WebRTC Protocol", variant: "primary" },
    { name: "HLS Streaming", variant: "purple" },
    { name: "Mediasoup SFU", variant: "emerald" },
    { name: "Next.js Framework", variant: "blue" },
  ],
  company: [
    { name: "About Us", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Contact", href: "#" },
  ],
  social: [
    { name: "GitHub", href: "#", icon: Github },
    { name: "Twitter", href: "#", icon: Twitter },
    { name: "LinkedIn", href: "#", icon: Linkedin },
  ],
};

// --- CVA Variant for Technology Dots ---
const techDotVariants = cva("h-1.5 w-1.5 rounded-full", {
  variants: {
    variant: {
      primary: "bg-primary",
      purple: "bg-purple-500",
      emerald: "bg-emerald-500",
      blue: "bg-blue-500",
    },
  },
});

// --- Reusable Sub-Components ---

/**
 * Renders a list of links or technology tags for a footer column.
 */
const FooterLinkList = ({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) => (
  <div className="space-y-4">
    <h4 className="font-mono uppercase tracking-wider text-muted-foreground">
      {title}
    </h4>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.name}>
          {"href" in link ? (
            <Link
              href={link.href}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.icon && <link.icon className="h-4 w-4" />}
              {link.name}
            </Link>
          ) : (
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <div className={techDotVariants({ variant: link.variant })} />
              {link.name}
            </div>
          )}
        </li>
      ))}
    </ul>
  </div>
);

/**
 * Renders the main brand and social links section of the footer.
 */
const BrandSection = () => (
  <div className="space-y-4">
    <Link href="/" className="flex items-center gap-3 group">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-transform duration-300 group-hover:scale-105">
        <Video className="h-6 w-6 text-primary-foreground" />
      </div>
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative">
          <img
            src="/logo.png"
            alt="Relay Logo"
            className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
    </Link>
    <p className="leading-relaxed text-muted-foreground">
      Production-grade streaming platform for creators, businesses, and
      enterprises worldwide.
    </p>
    <div className="flex gap-2">
      {footerLinks.social.map((social) => (
        <Link
          key={social.name}
          href={"href" in social ? social.href : "#"}
          aria-label={social.name}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          {"icon" in social && social.icon && (
            <social.icon className="h-5 w-5" />
          )}
        </Link>
      ))}
    </div>
  </div>
);

// --- Main Footer Component ---

export function Footer() {
  return (
    <footer className="border-t border-border/20 bg-background/50 backdrop-blur-md">
      <div className="px-4 py-16 sm:py-20">
        <div className="grid gap-12 text-sm md:grid-cols-2 lg:grid-cols-4">
          <BrandSection />
          <FooterLinkList title="Platform" links={footerLinks.platform} />
          <FooterLinkList title="Tech Stack" links={footerLinks.technology} />
          <FooterLinkList title="Company" links={footerLinks.company} />
        </div>

        <Separator className="my-12 bg-border/10" />

        <div className="flex flex-col-reverse items-center justify-between gap-6 md:flex-row">
          <p className="font-mono text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Streamify. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
