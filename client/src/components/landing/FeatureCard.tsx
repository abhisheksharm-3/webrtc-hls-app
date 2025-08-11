"use client";

import React from 'react';

export interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  colorClass: string;
}

export const FeatureCard = ({ icon, title, description, colorClass }: FeatureCardProps) => {
  const IconComponent = icon;
  return (
    <div className="group text-center">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-white/20 group-hover:shadow-2xl ${colorClass}`}
      >
        <IconComponent className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div className="text-base font-semibold text-foreground">{title}</div>
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{description}</div>
    </div>
  );
};