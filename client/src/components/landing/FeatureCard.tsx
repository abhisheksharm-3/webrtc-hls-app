"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

// --- Variant Definitions ---
const cardIconVariants = cva(
  "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-white/20 group-hover:shadow-2xl",
  {
    variants: {
      color: {
        blue: "text-blue-400 shadow-blue-500/20",
        purple: "text-purple-400 shadow-purple-500/20",
        emerald: "text-emerald-400 shadow-emerald-500/20",
        orange: "text-orange-400 shadow-orange-500/20",
      },
    },
    defaultVariants: {
      color: "blue",
    },
  }
);

// --- Component Props ---
export interface FeatureCardProps extends VariantProps<typeof cardIconVariants> {
  icon: React.ElementType;
  title: string;
  description: string;
}

// --- The Component ---
export const FeatureCard = ({ color, icon, title, description }: FeatureCardProps) => {
  const IconComponent = icon;
  return (
    <div className="text-center">
      <div className={cardIconVariants({ color })}>
        <IconComponent className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div className="text-base font-semibold text-foreground">{title}</div>
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {description}
      </div>
    </div>
  );
};