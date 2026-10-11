"use client";

import React, { useState } from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function VipsLogo({ className = "", size = 38 }: LogoProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-[#881337] text-white flex items-center justify-center font-bold text-xs rounded-xs border border-[#FDE68A] ${className}`}
      >
        VIPS
      </div>
    );
  }

  return (
    <img
      src="/logos/vips-logo.png"
      alt="VIPS-TC Official Logo"
      width={size}
      height={size}
      onError={() => setError(true)}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function DtuLogo({ className = "", size = 38 }: LogoProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-[#1E1B4B] text-[#FDE68A] flex items-center justify-center font-bold text-xs rounded-xs border border-[#FBBF24] ${className}`}
      >
        DTU
      </div>
    );
  }

  return (
    <img
      src="/logos/dtu-logo.png"
      alt="DTU Official Logo"
      width={size}
      height={size}
      onError={() => setError(true)}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function KccLogo({ className = "", size = 38 }: LogoProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-[#991B1B] text-white flex items-center justify-center font-bold text-xs rounded-xs border border-[#FECACA] ${className}`}
      >
        KCC
      </div>
    );
  }

  return (
    <img
      src="/logos/kcc-logo.webp"
      alt="KCC-ITM Official Logo"
      width={size}
      height={size}
      onError={() => setError(true)}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function CollegeLogoRenderer({ collegeCode, size = 38 }: { collegeCode: string; size?: number }) {
  switch (collegeCode) {
    case "VIPS-TC":
      return <VipsLogo size={size} />;
    case "DTU":
      return <DtuLogo size={size} />;
    case "KCC-ITM":
      return <KccLogo size={size} />;
    default:
      return <VipsLogo size={size} />;
  }
}
