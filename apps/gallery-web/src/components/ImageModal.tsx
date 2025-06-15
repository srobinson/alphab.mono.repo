import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { X } from "lucide-react";
import { useImageLoader } from "../hooks/use-image-loader";
import { LoadingProgress } from "./LoadingProgress";
import { ZoomControls } from "./ZoomControls";

interface Image {
  full: string;
  thumbnail: string;
}

interface ImageModalProps {
  image: Image;
  onClose: () => void;
  imageZoom: number;
  onDoubleClick: () => void;
  imageDimensions?: { width: number; height: number } | null;
  showPanHint: boolean;
  onDismissPanHint: () => void;
  zoomLabel: string;
  onZoomChange: (zoom: number) => void;
  onNextImage?: () => void;
  onPreviousImage?: () => void;
}

export function ImageModal({
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
}: ImageModalProps) {
  const { src: loadedSrc, isLoaded } = useImageLoader(image.thumbnail, image.full);
  const [isPanning, setIsPanning] = useState(false);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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

    let displayWidth: number, displayHeight: number;

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

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full h-full overflow-hidden"
      >
        <img
          src={image.thumbnail}
          alt="Loading background"
          className="absolute inset-0 w-screen h-screen object-cover transition-opacity duration-500"
          style={{
            filter: "blur(20px) saturate(.5)",
            transform: "scale(1.1)",
            opacity: 1,
          }}
        />
        <motion.img
          src={loadedSrc}
          alt="Full resolution"
          className={`relative block object-contain select-none ${
            isPanningEnabled ? "cursor-grab" : "cursor-pointer"
          } ${isPanning ? "cursor-grabbing" : ""}`}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 1s ease",
            x: panX,
            y: panY,
          }}
          animate={getZoomStyles(imageZoom)}
          transition={{
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
            type: "tween",
          }}
          onDoubleClick={onDoubleClick}
          drag={isPanningEnabled}
          dragConstraints={panConstraints}
          dragElastic={0.05}
          dragMomentum={false}
          onDragStart={() => {
            setIsPanning(true);
            document.body.style.cursor = "grabbing";
          }}
          onDragEnd={() => {
            setIsPanning(false);
            document.body.style.cursor = "default";
          }}
          whileDrag={{ scale: 0.98 }}
        />
        <LoadingProgress isLoaded={isLoaded} />
        {isPanningEnabled && isLoaded && showPanHint && (
          <motion.div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 px-3 py-2 rounded-lg bg-black/70 text-white text-sm pointer-events-auto flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 1, duration: 2 }}
          >
            <span>Drag to pan • Double-click to zoom</span>
            <button
              onClick={() => onDismissPanHint()}
              className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
              title="Don't show again"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <X size={24} />
      </button>
      <ZoomControls imageZoom={imageZoom} onZoomChange={onZoomChange} />
      <motion.div
        className="absolute top-4 left-4 z-20 px-3 py-2 rounded-lg bg-black/50 text-white text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {zoomLabel}
        {imageDimensions && (
          <div className="text-xs text-white/60 mt-1">
            {imageDimensions.width} × {imageDimensions.height}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
