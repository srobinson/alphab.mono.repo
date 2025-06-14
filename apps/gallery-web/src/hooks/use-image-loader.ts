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

  useEffect(() => {
    // Reset states
    setHasError(false);
    setIsLoaded(false);
    setIsLoading(false);

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

    // Start loading high-res image
    setIsLoading(true);
    const highResImg = new Image();
    imageRef.current = highResImg;

    highResImg.onload = () => {
      // Check if this is still the current image request
      if (imageRef.current === highResImg) {
        setSrc(highResSrc);
        setIsLoaded(true);
        setIsLoading(false);
        setHasError(false);
      }
    };

    highResImg.onerror = () => {
      // Check if this is still the current image request
      if (imageRef.current === highResImg) {
        setHasError(true);
        setIsLoading(false);
        // Keep showing low-res image on error
      }
    };

    highResImg.src = highResSrc;

    // Cleanup function
    return () => {
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
