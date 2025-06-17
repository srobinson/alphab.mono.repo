import { useState, useEffect } from "react";

export const MOBILE_BREAKPOINT = 768;

/**
 * Centralized mobile detection utility
 * Combines user agent and viewport width detection
 */
export function isMobileDevice(): boolean {
  // Server-side fallback
  if (typeof window === "undefined") return false;

  // User agent check for mobile devices
  const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  // Viewport width check
  const viewportMobile = window.innerWidth < MOBILE_BREAKPOINT;

  return userAgentMobile || viewportMobile;
}

/**
 * React hook for responsive mobile detection with resize handling
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

/**
 * Get responsive column count based on viewport width
 */
export function getResponsiveColumns(maxColumns = 4): number {
  if (typeof window === "undefined") return maxColumns;

  const width = window.innerWidth;
  if (width < 500) return 1;
  if (width < 700) return 2;
  if (width < 1100) return 3;
  return maxColumns;
}
