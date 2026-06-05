'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

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
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const textLogoSrc = currentTheme === 'dark' ? '/logo-white.png' : '/logo-black.png';

  // Calculate icon width (it used to be width/3 when text was shown)
  const iconSize = showText ? height : Math.min(width, height);
  const textWidth = width - iconSize - 12; // 12px gap

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className={className}>
      {!imgError ? (
        <div style={{ position: 'relative', width: iconSize, height: iconSize }}>
          <Image 
            src="/parrot-icon.png" 
            alt="Charlo Icon" 
            fill
            style={{ objectFit: 'contain' }}
            priority
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div style={{ 
          width: iconSize, 
          height: iconSize, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: iconSize * 0.6,
          background: 'var(--accent-color)',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(44, 160, 90, 0.3)'
        }}>
          🦜
        </div>
      )}
      
      {showText && (
        <div style={{ 
          position: 'relative', 
          width: textWidth, 
          height: height * 0.7, // Slightly smaller than container height for better visual balance
          opacity: mounted ? 1 : 0, 
          transition: 'opacity 0.2s ease-in-out' 
        }}>
          {mounted && (
            <Image 
              src={textLogoSrc} 
              alt="Charlo" 
              fill
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
              priority
            />
          )}
        </div>
      )}
    </div>
  );
}
