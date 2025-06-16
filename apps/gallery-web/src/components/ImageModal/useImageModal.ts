import { useState, useRef, useMemo, useEffect } from "react";
import { useImageLoader } from "../../hooks/use-image-loader";
import { useMotionValue } from "framer-motion";
import type { ImageModalProps } from "./ImageModal";
export type { ImageModalProps };

export function useImageModal({
  image,
  onClose,
  imageZoom,
  onDoubleClick,
  imageDimensions,
  showPanHint,
  onDismissPanHint,
  zoomLabel,
  onZoomChange,
  onNextImage,
  onPreviousImage,
  isLoading = false,
}: ImageModalProps) {
  const { src: loadedSrc, isLoaded } = useImageLoader(image.thumbnail, image.full);
  const [isPanning, setIsPanning] = useState(false);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExiting, setIsExiting] = useState(false);

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
        onDoubleClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNextImage, onPreviousImage, onDoubleClick]);

  // Reset pan position on zoom or image change
  useEffect(() => {
    panX.set(0);
    panY.set(0);
  }, [imageZoom, image.full, panX, panY]);

  // Determine if panning is enabled based on image size and zoom level
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

  // Calculate zoom styles based on zoom level
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

  // Calculate panning constraints
  const getPanConstraints = () => {
    if (!imageDimensions || !isPanningEnabled) {
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;
    let displayWidth, displayHeight;
    if (imageZoom === 1) {
      displayWidth = imgWidth;
      displayHeight = imgHeight;
    } else if (imageZoom === 2) {
      displayWidth = viewportWidth;
      displayHeight = (imgHeight * viewportWidth) / imgWidth;
    } else {
      displayWidth = (imgWidth * viewportHeight) / imgHeight;
      displayHeight = viewportHeight;
    }
    const maxPanX = Math.max(0, (displayWidth - viewportWidth) / 2);
    const maxPanY = Math.max(0, (displayHeight - viewportHeight) / 2);
    return {
      left: -maxPanX,
      right: maxPanX,
      top: -maxPanY,
      bottom: maxPanY,
    };
  };

  const panConstraints = getPanConstraints();

  return {
    loadedSrc,
    isLoaded,
    isPanning,
    setIsPanning,
    panX,
    panY,
    containerRef,
    isExiting,
    setIsExiting,
    isPanningEnabled,
    getZoomStyles,
    panConstraints,
    image,
    onClose,
    imageZoom,
    onDoubleClick,
    imageDimensions,
    showPanHint,
    onDismissPanHint,
    zoomLabel,
    onZoomChange,
    onNextImage,
    onPreviousImage,
    isLoading,
  };
}
