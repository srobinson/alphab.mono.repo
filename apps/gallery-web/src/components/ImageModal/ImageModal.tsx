import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LoadingProgress } from "../LoadingProgress";
import { ZoomControls } from "../ZoomControls";

// Internal type for the presentational component
export type ImageModalViewProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  getZoomStyles: (zoom: number) => any;
  image: { full: string; thumbnail: string };
  imageDimensions?: { width: number; height: number } | null;
  imageZoom: number;
  isExiting: boolean;
  isLoaded: boolean;
  isLoading?: boolean;
  isPanning: boolean;
  isPanningEnabled: boolean;
  loadedSrc: string;
  onClose: () => void;
  onDismissPanHint: () => void;
  onDoubleClick: () => void;
  onNextImage?: () => void;
  onPreviousImage?: () => void;
  onZoomChange: (zoom: number) => void;
  panConstraints: any;
  panX: any;
  panY: any;
  setIsExiting: (val: boolean) => void;
  setIsPanning: (val: boolean) => void;
  showPanHint: boolean;
  zoomLabel: string;
};

export type ImageModalProps = {
  image: { full: string; thumbnail: string };
  imageDimensions?: { width: number; height: number } | null;
  imageZoom: number;
  isLoading?: boolean;
  onClose: () => void;
  onDismissPanHint: () => void;
  onDoubleClick: () => void;
  onNextImage?: () => void;
  onPreviousImage?: () => void;
  onZoomChange: (zoom: number) => void;
  showPanHint: boolean;
  zoomLabel: string;
};

export function ImageModal({
  containerRef,
  getZoomStyles,
  image,
  imageDimensions,
  imageZoom,
  isExiting,
  isLoaded,
  isLoading,
  isPanning,
  isPanningEnabled,
  loadedSrc,
  onClose,
  onDismissPanHint,
  onDoubleClick,
  onNextImage,
  onPreviousImage,
  onZoomChange,
  panConstraints,
  panX,
  panY,
  setIsExiting,
  setIsPanning,
  showPanHint,
  zoomLabel,
}: ImageModalViewProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        style={{ pointerEvents: isExiting ? "none" : "auto" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onAnimationStart={(def) => {
          if (def === "exit") setIsExiting(true);
        }}
        onAnimationComplete={(def) => {
          if (def === "exit") setIsExiting(false);
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
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
            onDragStart={() => setIsPanning(true)}
            onDragEnd={() => setIsPanning(false)}
            whileDrag={{ scale: 0.98 }}
          />
          <LoadingProgress isLoaded={isLoaded} />
          {isPanningEnabled && isLoaded && showPanHint && (
            <motion.div
              className="absolute bottom-20 mx-auto z-10 px-3 py-2 rounded-lg bg-black/70 text-white text-sm pointer-events-auto flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 1, duration: 0.3 }}
            >
              <span>Drag to pan</span>
              <button
                onClick={() => onDismissPanHint()}
                className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
                title="Don't show again"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
          {isLoading && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-black/80 text-white text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Fetching more images...</span>
            </div>
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
    </AnimatePresence>
  );
}
