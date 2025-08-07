"use client";

import Link from "next/link";
import { Menu, X, ArrowRight, Zap, Globe, Users, LucideIcon } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../mode-toggle";
import { cn } from "@/lib/utils";

// --- Constants ---
const navLinks = [
  {
    href: "#features",
    label: "Features",
    icon: Zap,
    description: "Powerful streaming tools",
  },
  {
    href: "#how-it-works",
    label: "How it Works",
    icon: Globe,
    description: "Simple setup process",
  },
  {
    href: "/watch",
    label: "Watch Streams",
    icon: Users,
    description: "Join live streams",
  },
];

// --- Sub-components ---

/**
 * Renders the site logo.
 */
const Logo = () => (
  <Link href="/" className="flex items-center gap-3 group">
    <div className="relative">
      <img
        src="/logo.png"
        alt="Relay Logo"
        className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  </Link>
);

/**
 * Renders the navigation links for the desktop view.
 */
const DesktopNav = () => (
  <div className="hidden items-center gap-2 md:flex">
    <nav className="items-center gap-2 md:flex">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50 rounded-md"
        >
          {link.label}
        </Link>
      ))}
    </nav>
    <div className="w-px h-6 bg-border/50 mx-4" />
    <ModeToggle />
  </div>
);

type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

/**
 * Renders a single animated link for the full-page mobile navigation.
 */
const MobileNavLink = ({
  link,
  index,
  isOpen,
  onClick,
}: {
  link: NavLinkItem;
  index: number;
  isOpen: boolean;
  onClick: () => void;
}) => {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      className={cn(
        "group relative flex items-center gap-4 p-6 rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card/80 hover:border-primary/20 hover:shadow-lg",
        "transform transition-transform duration-500 ease-out",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
      style={{
        transitionDelay: isOpen ? `${index * 100}ms` : "0ms",
      }}
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-sans text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
          {link.label}
        </div>
        <div className="font-mono text-sm text-muted-foreground mt-1">
          {link.description}
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
};

/**
 * Renders the full-page mobile navigation.
 */
const MobileNav = ({
  isOpen,
  onToggle,
  onClose,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) => {
  // Use a CSS class on the body to prevent scrolling when the menu is open.
  useEffect(() => {
    const bodyClass = "no-scroll";
    if (isOpen) {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList.remove(bodyClass);
    }
    return () => {
      document.body.classList.remove(bodyClass);
    };
  }, [isOpen]);

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <ModeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-10 w-10 rounded-full relative z-50"
        >
          <span className="sr-only">Toggle menu</span>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div
        className={cn(
          "fixed inset-0 bg-background/95 backdrop-blur-lg md:hidden transition-all duration-500 ease-in-out z-40 h-screen py-24",
          isOpen
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-full pointer-events-none"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255_0.1)_1px,transparent_0)] [background-size:20px_20px] opacity-20" />

        <div className="relative flex flex-col h-full">
          <div className="flex-shrink-0 px-6 pt-24 pb-8 text-center">
            {/* Reusing the Logo component */}
            <div className="inline-flex">
               <Logo />
            </div>
          </div>

          <nav className="flex-1 px-6 space-y-4">
            {navLinks.map((link, index) => (
              // Using the extracted MobileNavLink component
              <MobileNavLink
                key={link.href}
                link={link}
                index={index}
                isOpen={isOpen}
                onClick={onClose}
              />
            ))}
          </nav>

          <div className="flex-shrink-0 p-6 space-y-6">
            <div className="text-center space-y-2">
              <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase">
                {"// Ready to stream?"}
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-sans text-sm text-muted-foreground">
                  Live & Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * The main application header.
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-20 items-center justify-between px-4 max-w-screen-2xl mx-auto">
        <Logo />
        <DesktopNav />
        <MobileNav
          isOpen={mobileMenuOpen}
          onToggle={toggleMobileMenu}
          onClose={closeMobileMenu}
        />
      </div>
    </header>
  );
}