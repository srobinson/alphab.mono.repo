import { useState, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useAnimation } from "framer-motion";
import { useImageLoader } from "./use-image-loader";
import { useGalleryContext } from "../contexts/GalleryContext";
import { useMobileGestures } from "./useMobileGestures";
import { useIsMobile } from "../utils/device";

export type UseImageModalArgs = {
  image: { full: string; thumbnail: string };
  imageDimensions?: { width: number; height: number } | null;
  isPaging?: boolean;
  onClose: () => void;
  onNextImage?: () => void;
  onPreviousImage?: () => void;
};

export function useImageModal({
  image,
  imageDimensions,
  isPaging = false,
  onClose,
  onNextImage,
  onPreviousImage,
}: UseImageModalArgs) {
  // Progressive image loading (working system)
  const { src: loadedSrc, isLoaded, hasError } = useImageLoader(image.thumbnail, image.full);

  // Use centralized mobile detection FIRST
  const isMobile = useIsMobile();

  // Track if we've initialized mobile zoom for this modal session
  const hasInitializedMobileZoom = useRef(false);

  // Debounce zoom changes to prevent rapid cycling issues
  const lastZoomChange = useRef(Date.now());

  // Use context for persistent state (with fallback for when context isn't available)
  let contextImageZoom, contextSetImageZoom, contextShowPanHint, contextSetShowPanHint;
  try {
    const context = useGalleryContext();
    contextImageZoom = context.imageZoom;
    contextSetImageZoom = context.setImageZoom;
    contextShowPanHint = context.showPanHint;
    contextSetShowPanHint = context.setShowPanHint;
  } catch {
    // Fallback when context is not available
    contextImageZoom = null;
    contextSetImageZoom = null;
    contextShowPanHint = null;
    contextSetShowPanHint = null;
  }

  // Modal state - use context if available, otherwise local state
  const [localImageZoom, setLocalImageZoom] = useState<1 | 2 | 3>(isMobile ? 3 : 1);
  const [localShowPanHint, setLocalShowPanHint] = useState(true);

  // Mobile-specific zoom management: always start with Fit Height on mobile
  const imageZoom = contextImageZoom || localImageZoom;
  const setImageZoom = contextSetImageZoom || setLocalImageZoom;
  const showPanHint = contextShowPanHint !== null ? contextShowPanHint : localShowPanHint;
  const setShowPanHint = contextSetShowPanHint || setLocalShowPanHint;

  // Force mobile to start with Fit Height when modal opens
  useEffect(() => {
    if (isMobile && !hasInitializedMobileZoom.current) {
      console.log("🎯 Mobile Modal: Forcing Fit Height (3) on open");
      // Small delay to prevent race conditions with context initialization
      setTimeout(() => {
        setImageZoom(3);
        hasInitializedMobileZoom.current = true;
      }, 50);
    }
  }, [isMobile, setImageZoom]);

  // Reset mobile zoom initialization when image changes
  useEffect(() => {
    hasInitializedMobileZoom.current = false;
  }, [image.full]);

  // Modal state
  const [isPanning, setIsPanning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Refs and controls
  const containerRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const imgControls = useAnimation();
  const imgRef = useRef<any>(null);

  // Zoom cycle handler (defined early so it can be used in event listeners)
  const handleZoomCycle = () => {
    const now = Date.now();
    const timeSinceLastChange = now - lastZoomChange.current;

    // Debounce: prevent zoom changes faster than 300ms
    if (timeSinceLastChange < 300) {
      console.log("🎯 Zoom Cycle Debounced:", { timeSinceLastChange });
      return;
    }

    console.log("🎯 Zoom Cycle:", { current: imageZoom, isMobile });
    lastZoomChange.current = now;

    if (isMobile) {
      // Mobile: 2-level cycle - Fit Height (3) ↔ Original (1)
      const nextZoom = imageZoom === 3 ? 1 : 3;
      console.log("🎯 Mobile Zoom Cycle:", { from: imageZoom, to: nextZoom });
      setImageZoom(nextZoom as 1 | 2 | 3);
    } else {
      // Desktop: 3 levels - Original (1) → Fit Width (2) → Fit Height (3) → repeat
      const nextZoom = imageZoom === 1 ? 2 : imageZoom === 2 ? 3 : 1;
      console.log("🎯 Desktop Zoom Cycle:", { from: imageZoom, to: nextZoom });
      setImageZoom(nextZoom as 1 | 2 | 3);
    }
  };

  // Mobile gesture support (with proper callbacks)
  const mobileGestures = useMobileGestures({
    onSwipeLeft: () => {
      if (onNextImage) {
        onNextImage();
      }
    },
    onSwipeRight: () => {
      if (onPreviousImage) {
        onPreviousImage();
      }
    },
    onSwipeUp: () => {
      // Swipe up closes the modal on mobile
      onClose();
    },
    onDoubleTap: handleZoomCycle,
    // Note: onPinchZoom removed since native touch events don't support pinch gestures
    disabled: hasError, // Only disable on error, not while loading
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight" && onNextImage) {
        e.preventDefault();
        onNextImage();
      } else if (e.key === "ArrowLeft" && onPreviousImage) {
        e.preventDefault();
        onPreviousImage();
      } else if (e.key === " ") {
        e.preventDefault();
        handleZoomCycle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNextImage, onPreviousImage, handleZoomCycle]);

  // Reset pan state on zoom or image change
  useEffect(() => {
    setIsPanning(false);
  }, [imageZoom, image.full]);

  // Zoom styles - original working logic with mobile-specific enhancements
  const getZoomStyles = (zoom: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!imageDimensions) {
      // Fallback styles when dimensions aren't available
      switch (zoom) {
        case 1:
          return {
            width: 800,
            height: 600,
          };
        case 2:
          return {
            width: viewportWidth,
            height: 600,
          };
        case 3:
          return {
            width: 800,
            height: viewportHeight,
          };
        default:
          return {
            width: 800,
            height: 600,
          };
      }
    }

    const { width: imgWidth, height: imgHeight } = imageDimensions;

    switch (zoom) {
      case 1:
        // Original size - same for both platforms
        return {
          width: imgWidth,
          height: imgHeight,
        };
      case 2:
        // Fit Width - same calculation for both platforms
        return {
          width: viewportWidth,
          height: (imgHeight * viewportWidth) / imgWidth,
        };
      case 3:
        // Fit Height - mobile fills viewport, desktop unchanged
        if (isMobile) {
          // Mobile: Use full viewport height for better fill
          const calculatedWidth = (imgWidth * viewportHeight) / imgHeight;
          console.log("🎯 Mobile Fit Height Calculation:", {
            viewportHeight,
            imgWidth,
            imgHeight,
            calculatedWidth,
          });
          return {
            // width: calculatedWidth,
            height: viewportHeight,
            objectFit: "cover",
          };
        } else {
          // Desktop: preserve original behavior exactly
          return {
            width: (imgWidth * viewportHeight) / imgHeight,
            height: viewportHeight,
          };
        }
      default:
        return {
          width: imgWidth,
          height: imgHeight,
        };
    }
  };

  // Animate zoom changes and pan reset smoothly (translateX(0) translateY(0))
  useEffect(() => {
    const zoomStyles = getZoomStyles(imageZoom);
    // Only log on mobile for debugging mobile-specific issues
    if (isMobile) {
      console.log("🎯 Mobile Zoom Animation:", {
        imageZoom,
        zoomStyles,
        hasImageDimensions: !!imageDimensions,
        isLoaded,
      });
    }

    // Ensure animation happens
    imgControls.start({
      ...zoomStyles,
      x: 0,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    });
  }, [imageZoom, image.full, imgControls, imageDimensions, isMobile, isLoaded]);

  // Panning enabled logic
  const isPanningEnabled = useMemo(() => {
    if (!imageDimensions) return false;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;

    if (imageZoom === 1) {
      // Original size - enable panning if image is larger than viewport
      return imgWidth > viewportWidth || imgHeight > viewportHeight;
    } else if (imageZoom === 2) {
      // Fit Width - enable panning if scaled height exceeds viewport
      const scaledHeight = (imgHeight * viewportWidth) / imgWidth;
      return scaledHeight > viewportHeight;
    } else if (imageZoom === 3) {
      // Fit Height - disable panning completely (should always fit in viewport)
      return false;
    }
    return false;
  }, [imageDimensions, imageZoom]);

  // Pan constraints
  const panConstraints = useMemo(() => {
    if (!imageDimensions) return { left: 0, right: 0, top: 0, bottom: 0 };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;

    if (imageZoom === 1) {
      // Original size - constrain to image bounds
      const xOverflow = Math.max(0, imgWidth - viewportWidth);
      const yOverflow = Math.max(0, imgHeight - viewportHeight);
      return {
        left: -xOverflow / 2,
        right: xOverflow / 2,
        top: -yOverflow / 2,
        bottom: yOverflow / 2,
      };
    } else if (imageZoom === 2) {
      // Fit Width - only vertical panning
      const scaledHeight = (imgHeight * viewportWidth) / imgWidth;
      const yOverflow = Math.max(0, scaledHeight - viewportHeight);
      return {
        left: 0,
        right: 0,
        top: -yOverflow / 2,
        bottom: yOverflow / 2,
      };
    } else if (imageZoom === 3) {
      // Fit Height - no panning (should always fit)
      return { left: 0, right: 0, top: 0, bottom: 0 };
    } else {
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }
  }, [imageDimensions, imageZoom]);

  // Zoom label
  const zoomLabel = useMemo(() => {
    switch (imageZoom) {
      case 1:
        return "Original Size";
      case 2:
        return "Fit Width";
      case 3:
        return "Fit Height";
      default:
        throw new Error("Invalid image zoom");
    }
  }, [imageZoom]);

  return {
    loadedSrc,
    isLoaded,
    hasError,
    imageZoom,
    setImageZoom,
    handleZoomCycle,
    showPanHint,
    setShowPanHint,
    isPanning,
    setIsPanning,
    isExiting,
    setIsExiting,
    containerRef,
    imgControls,
    imgRef,
    isPanningEnabled,
    panConstraints,
    zoomLabel,
    getZoomStyles,
    // Mobile gesture support
    mobileGestureBindings: mobileGestures.bind,
    isGestureActive: mobileGestures.isGestureActive,
    gestureState: mobileGestures.gestureState,
    swipeIndicator: mobileGestures.getSwipeIndicator(),
    isMobile: mobileGestures.isMobile,
    triggerHaptic: mobileGestures.triggerHaptic,
  };
}
