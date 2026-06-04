'use client';

import Image from 'next/image';
import { useState } from 'react';

export function CharloLogo({ 
  width = 120, 
  height = 40,
  showText = true,
  className = ""
}: { 
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className={className}>
      {!imgError ? (
        <div style={{ position: 'relative', width: width / (showText ? 3 : 1), height: height }}>
          <Image 
            src="/logo.jpg" 
            alt="Charlo Logo" 
            fill
            style={{ objectFit: 'contain' }}
            priority
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div style={{ 
          width: width / (showText ? 3 : 1), 
          height: height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: height * 0.6,
          background: 'var(--accent-color)',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(44, 160, 90, 0.3)'
        }}>
          🦜
        </div>
      )}
      {showText && (
        <span style={{ 
          fontSize: "1.5rem", 
          fontWeight: 800, 
          background: "linear-gradient(135deg, var(--accent-color) 0%, var(--warning) 100%)", 
          WebkitBackgroundClip: "text", 
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.02em"
        }}>
          Charlo
        </span>
      )}
    </div>
  );
}
