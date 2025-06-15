// apps/gallery-web/src/hooks/use-image-loader.ts
// Enhanced useImageLoader hook with minimum transition duration
import { useState, useEffect, useRef } from "react";

interface UseImageLoaderReturn {
  src: string;
  isLoaded: boolean;
  hasError: boolean;
  isLoading: boolean;
}

export const useImageLoader = (lowResSrc?: string, highResSrc?: string): UseImageLoaderReturn => {
  const [src, setSrc] = useState(lowResSrc || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const loadStartTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset states
    setHasError(false);
    setIsLoaded(false);
    setIsLoading(false);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!lowResSrc) {
      setSrc("");
      return;
    }

    // Set low-res image immediately
    setSrc(lowResSrc);

    // If no high-res image, we're done
    if (!highResSrc) {
      setIsLoaded(true);
      return;
    }

    // Start loading high-res image and record start time
    setIsLoading(true);
    loadStartTimeRef.current = Date.now();
    const highResImg = new Image();
    imageRef.current = highResImg;

    highResImg.onload = () => {
      // Check if this is still the current image request
      if (imageRef.current === highResImg) {
        const loadTime = Date.now() - loadStartTimeRef.current;
        const minTransitionTime = 333;

        if (loadTime < minTransitionTime) {
          // If image loaded too quickly, delay the transition
          timeoutRef.current = setTimeout(() => {
            setSrc(highResSrc);
            setIsLoaded(true);
            setIsLoading(false);
            setHasError(false);
          }, minTransitionTime - loadTime);
        } else {
          // Image took long enough, show immediately
          setSrc(highResSrc);
          setIsLoaded(true);
          setIsLoading(false);
          setHasError(false);
        }
      }
    };

    highResImg.onerror = () => {
      // Check if this is still the current image request
      if (imageRef.current === highResImg) {
        const loadTime = Date.now() - loadStartTimeRef.current;
        const minTransitionTime = 500;

        if (loadTime < minTransitionTime) {
          timeoutRef.current = setTimeout(() => {
            setHasError(true);
            setIsLoading(false);
            // Keep showing low-res image on error
          }, minTransitionTime - loadTime);
        } else {
          setHasError(true);
          setIsLoading(false);
          // Keep showing low-res image on error
        }
      }
    };

    highResImg.src = highResSrc;

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
        imageRef.current = null;
      }
    };
  }, [lowResSrc, highResSrc]);

  return {
    src,
    isLoaded,
    hasError,
    isLoading,
  };
};
