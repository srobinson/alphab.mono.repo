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
            // width: 800,
            // height: 600,
            width: "auto",
            height: "auto",
            maxWidth: isMobile ? "95vw" : "90vw",
            maxHeight: isMobile ? "80vh" : "90vh",
          };
        case 2:
          return {
            // width: viewportWidth,
            // height: 600,
            width: isMobile ? "100vw" : "100vw",
            height: "auto",
            maxHeight: isMobile ? "80vh" : "90vh",
          };
        case 3:
          return {
            // width: 800,
            // height: viewportHeight,
            width: "auto",
            height: isMobile ? "80vh" : "100vh",
            maxWidth: isMobile ? "95vw" : "90vw",
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
        // Original size - show full image but keep it manageable on mobile
        if (isMobile) {
          console.log("🎯 Mobile Original Size Styles:", {
            imgWidth,
            imgHeight,
            viewportWidth,
            viewportHeight,
            "Image larger than viewport": {
              horizontally: imgWidth > viewportWidth,
              vertically: imgHeight > viewportHeight,
            },
            "Dimensions ratio": {
              "Image aspect": (imgWidth / imgHeight).toFixed(2),
              "Viewport aspect": (viewportWidth / viewportHeight).toFixed(2),
            },
          });

          // For mobile: use full image dimensions and ensure no constraints
          return {
            width: imgWidth,
            height: imgHeight,
            minWidth: imgWidth, // Force minimum width
            minHeight: imgHeight, // Force minimum height
            maxWidth: imgWidth, // Force exact width
            maxHeight: imgHeight, // Force exact height
          };
        } else {
          // Desktop: FIXED - use full dimensions with unset constraints
          return {
            width: imgWidth,
            height: imgHeight,
            maxWidth: "unset",
            maxHeight: "unset",
          };
        }
      case 2:
        // Fit Width - same calculation for both platforms
        return {
          width: viewportWidth,
          height: (imgHeight * viewportWidth) / imgWidth,
          maxWidth: "unset",
          maxHeight: "unset",
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
    const animationProps = {
      ...zoomStyles,
      x: 0,
      y: 0,
    };

    if (isMobile && imageZoom === 1) {
      console.log("🎯 Animation Props for Original Size:", animationProps);

      // Debug: Check if image element is being constrained
      setTimeout(() => {
        const imgElement = document.querySelector("motion.img") as HTMLImageElement;
        if (imgElement) {
          const computedStyle = window.getComputedStyle(imgElement);
          console.log("🎯 Computed Image Styles:", {
            width: computedStyle.width,
            height: computedStyle.height,
            maxWidth: computedStyle.maxWidth,
            maxHeight: computedStyle.maxHeight,
            objectFit: computedStyle.objectFit,
            "Natural dimensions": {
              naturalWidth: imgElement.naturalWidth,
              naturalHeight: imgElement.naturalHeight,
            },
          });
        }
      }, 100);
    }

    imgControls.start(animationProps, { duration: 0.3, ease: "easeOut" });
  }, [imageZoom, image.full, imgControls, imageDimensions, isMobile, isLoaded]);

  // Panning enabled logic
  const isPanningEnabled = useMemo(() => {
    if (!imageDimensions) return false;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;

    if (imageZoom === 1) {
      // Original size - enable panning if image is larger than viewport
      const needsPanning = imgWidth > viewportWidth || imgHeight > viewportHeight;
      if (isMobile) {
        console.log("🎯 Mobile Panning Check:", {
          imageZoom,
          imgWidth,
          imgHeight,
          viewportWidth,
          viewportHeight,
          needsPanning,
          calculation: `${imgWidth} > ${viewportWidth} || ${imgHeight} > ${viewportHeight}`,
        });
      }
      return needsPanning;
    } else if (imageZoom === 2) {
      // Fit Width - enable panning if scaled height exceeds viewport
      const scaledHeight = (imgHeight * viewportWidth) / imgWidth;
      return scaledHeight > viewportHeight;
    } else if (imageZoom === 3) {
      // Fit Height - disable panning completely (should always fit in viewport)
      return false;
    }
    return false;
  }, [imageDimensions, imageZoom, isMobile]);

  // Mobile gesture support (with proper callbacks and panning awareness)
  const mobileGestures = useMobileGestures({
    onDragStart: () => {
      console.log("🎯 Mobile Gesture: Drag Start");
    },
    onDragEnd: () => {
      console.log("🎯 Mobile Gesture: Drag End");
    },
    onSwipeLeft: () => {
      // Only allow navigation when not in panning mode
      if (onNextImage && !isPanningEnabled) {
        console.log("🎯 Mobile Navigation: Next Image");
        onNextImage();
      } else if (isPanningEnabled) {
        console.log("🎯 Swipe Left blocked - in panning mode");
      }
    },
    onSwipeRight: () => {
      // Only allow navigation when not in panning mode
      if (onPreviousImage && !isPanningEnabled) {
        console.log("🎯 Mobile Navigation: Previous Image");
        onPreviousImage();
      } else if (isPanningEnabled) {
        console.log("🎯 Swipe Right blocked - in panning mode");
      }
    },
    onSwipeUp: () => {
      // Swipe up closes the modal on mobile - but NOT when in panning mode
      if (!isPanningEnabled) {
        console.log("🎯 Swipe Up - closing modal");
        onClose();
      } else {
        console.log("🎯 Swipe Up blocked - in panning mode (use double-tap to exit panning)");
      }
    },
    onDoubleTap: () => {
      // Double tap always available for zoom cycling
      console.log("🎯 Double Tap - cycling zoom");
      handleZoomCycle();
    },
    // Pass panning state so gestures can coordinate with Framer Motion
    isPanningEnabled,
    disabled: hasError, // Only disable on error, keep gestures active for double-tap
  });

  // Pan constraints
  const panConstraints = useMemo(() => {
    if (!imageDimensions) return { left: 0, right: 0, top: 0, bottom: 0 };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;

    if (imageZoom === 1) {
      // Original size - constrain to image bounds properly
      const xOverflow = Math.max(0, imgWidth - viewportWidth);
      const yOverflow = Math.max(0, imgHeight - viewportHeight);

      // For proper panning, we need to ensure the image can move to show all parts
      // When image is centered, we can move it left/up by half the overflow
      // and right/down by half the overflow to reveal all edges
      const constraints = {
        left: -xOverflow / 2,
        right: xOverflow / 2,
        top: -yOverflow / 2,
        bottom: yOverflow / 2,
      };

      if (isMobile) {
        console.log("🎯 Mobile Pan Constraints DEBUG:", {
          constraints,
          xOverflow,
          yOverflow,
          imageSize: { imgWidth, imgHeight },
          viewport: { viewportWidth, viewportHeight },
          "Image larger than viewport": {
            horizontally: imgWidth > viewportWidth,
            vertically: imgHeight > viewportHeight,
          },
          "Pan calculation": {
            "xOverflow/2": xOverflow / 2,
            "yOverflow/2": yOverflow / 2,
            "left boundary": -xOverflow / 2,
            "right boundary": xOverflow / 2,
          },
        });
      }

      return constraints;
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
  }, [imageDimensions, imageZoom, isMobile]);

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
