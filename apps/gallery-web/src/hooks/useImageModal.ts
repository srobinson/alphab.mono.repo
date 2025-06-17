import { useState, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useAnimation } from "framer-motion";
import { useImageLoader } from "./use-image-loader";

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
  // Progressive image loading
  const { src: loadedSrc, isLoaded, hasError } = useImageLoader(image.thumbnail, image.full);

  // Modal state
  const [imageZoom, setImageZoom] = useState<1 | 2 | 3>(2); // 1: original, 2: fit width, 3: fit height
  const [showPanHint, setShowPanHint] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [transitionType, setTransitionType] = useState<"unzip" | "fade" | "slide">("unzip");
  const [phase, setPhase] = useState<"idle" | "drawing" | "splitting">("idle");
  const [isUnzipping, setIsUnzipping] = useState(false);
  const [unzipDirection, setUnzipDirection] = useState<"next" | "prev" | null>(null);
  const [prevImage, setPrevImage] = useState(image);
  const [showUnzip, setShowUnzip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const imgControls = useAnimation();
  const imgRef = useRef<any>(null);

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
  }, [onClose, onNextImage, onPreviousImage]);

  // Reset pan state on zoom or image change
  useEffect(() => {
    setIsPanning(false);
  }, [imageZoom, image.full]);

  // Animate zoom changes and pan reset smoothly (translateX(0) translateY(0))
  useEffect(() => {
    imgControls.start({ ...getZoomStyles(imageZoom), x: 0, y: 0 });
  }, [imageZoom, image.full, imgControls]);

  // Overlay unzip animation
  useEffect(() => {
    if (isUnzipping) setShowUnzip(true);
    else if (showUnzip) setShowUnzip(false);
  }, [isUnzipping]);

  // Panning enabled logic
  const isPanningEnabled = useMemo(() => {
    if (!imageDimensions || imageZoom === 3) return false;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;
    if (imageZoom === 1) {
      return imgWidth > viewportWidth || imgHeight > viewportHeight;
    } else if (imageZoom === 2) {
      const scaledHeight = (imgHeight * viewportWidth) / imgWidth;
      return scaledHeight > viewportHeight;
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
      const xOverflow = Math.max(0, imgWidth - viewportWidth);
      const yOverflow = Math.max(0, imgHeight - viewportHeight);
      return {
        left: -xOverflow / 2,
        right: xOverflow / 2,
        top: -yOverflow / 2,
        bottom: yOverflow / 2,
      };
    } else if (imageZoom === 2) {
      const scaledHeight = (imgHeight * viewportWidth) / imgWidth;
      const yOverflow = Math.max(0, scaledHeight - viewportHeight);
      return {
        left: 0,
        right: 0,
        top: -yOverflow / 2,
        bottom: yOverflow / 2,
      };
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

  // Zoom styles
  const getZoomStyles = (zoom: number) => {
    if (!imageDimensions) {
      switch (zoom) {
        case 1:
          return { width: "auto", height: "auto", maxWidth: "90vw", maxHeight: "90vh" };
        case 2:
          return { width: "100vw", height: "auto" };
        case 3:
          return { width: "auto", height: "100vh" };
        default:
          return { width: "auto", height: "auto", maxWidth: "90vw", maxHeight: "90vh" };
      }
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;
    switch (zoom) {
      case 1:
        return {
          width: imgWidth,
          height: imgHeight,
          maxWidth: "unset",
          maxHeight: "unset",
        };
      case 2:
        return {
          width: viewportWidth,
          height: (imgHeight * viewportWidth) / imgWidth,
          maxWidth: "unset",
          maxHeight: "unset",
        };
      case 3:
        return {
          width: (imgWidth * viewportHeight) / imgHeight,
          height: viewportHeight,
        };
      default:
        return { width: "unset", height: "unset" };
    }
  };

  // Zoom cycle handler
  const handleZoomCycle = () => {
    setImageZoom((prev) => {
      const nextZoom = prev === 1 ? 2 : prev === 2 ? 3 : 1;
      return nextZoom as 1 | 2 | 3;
    });
  };

  // Transition selector UI
  const transitions = [
    { key: "unzip", label: "Unzip" },
    { key: "fade", label: "Fade" },
    { key: "slide", label: "Slide" },
  ];

  // Add a handler to trigger animated transition before changing image
  const triggerTransition = (direction: "next" | "prev") => {
    setPrevImage(image);
    setUnzipDirection(direction);
    setPhase("drawing");
    setTimeout(() => {
      setPhase("splitting");
      setTimeout(() => {
        setPhase("idle");
        if (direction === "next" && onNextImage) onNextImage();
        if (direction === "prev" && onPreviousImage) onPreviousImage();
      }, 400);
    }, 200);
  };

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
    transitionType,
    setTransitionType,
    phase,
    setPhase,
    isUnzipping,
    setIsUnzipping,
    unzipDirection,
    setUnzipDirection,
    prevImage,
    setPrevImage,
    showUnzip,
    setShowUnzip,
    containerRef,
    imgControls,
    imgRef,
    isPanningEnabled,
    panConstraints,
    zoomLabel,
    getZoomStyles,
    transitions,
    triggerTransition,
  };
}
