import Link from "next/link";
import { Video, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../mode-toggle";
import { cn } from "@/lib/utils";

// Define navigation links here to avoid repetition
const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "/watch", label: "Watch Streams" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-20 max-w-screen items-center justify-between px-4">
        {/* Logo and Brand Name */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-transform duration-300 group-hover:scale-105">
              <Video className="h-6 w-6 text-primary-foreground" />
            </div>
            {/* "Live" indicator */}
            <div className="absolute -right-1 -top-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-background bg-emerald-500"></span>
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold tracking-tight">
              Streamify
            </div>
            <p className="text-xs text-muted-foreground">Next-Gen Streaming</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
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
          <div className="w-px h-6 bg-border/50 mx-4"></div>
          <Button
            size="sm"
            className="transition-all duration-300 ease-in-out shadow-[0_0_10px_theme(colors.primary/30%)] hover:shadow-[0_0_25px_theme(colors.primary/50%)]"
          >
            Get Started
          </Button>
          <ModeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-10 w-10 rounded-full"
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      <div
        className={cn(
          "absolute left-0 w-full border-b border-border bg-background/95 backdrop-blur md:hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <nav className="flex flex-col gap-2 px-4 py-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 border-t border-border/20 pt-6">
            <Button size="lg" className="w-full">
              Get Started
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
