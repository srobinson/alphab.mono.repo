import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X } from "lucide-react";
import { LoadingProgress } from "../LoadingProgress";
import { ZoomControls } from "../ZoomControls";
import { PanHint } from "./PanHint";
import { LoadingOverlay } from "./LoadingOverlay";
import { ZoomLabel } from "./ZoomLabel";
import type { ImageModalProps } from "./types";

// Clean grouped props - much more readable and maintainable!
export function ImageModal({ core, state, zoom, pan, mobile, refs }: ImageModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onClick={(e) => e.target === e.currentTarget && core.onClose()}
    >
      <div
        ref={refs.containerRef}
        className="relative flex items-center justify-center w-full h-full overflow-hidden"
        style={{
          touchAction: mobile.isMobile
            ? pan.isPanningEnabled
              ? "none"
              : "none" // Allow all gestures (including vertical swipe up to close)
            : "auto",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        {...(mobile.mobileGestureBindings?.() || {})}
      >
        {/* Blurred background - provides visual context while main image loads */}
        <img
          src={core.image.thumbnail}
          alt="Background"
          className="absolute inset-0 w-screen h-screen object-cover transition-opacity duration-500"
          style={{
            filter: "blur(20px) saturate(.875)",
            opacity: 1,
          }}
        />

        {/* Main image - progressive loading: starts with thumbnail, switches to full res when loaded */}
        {state.loadedSrc && (
          <motion.img
            ref={refs.imgRef}
            src={state.loadedSrc}
            alt="Full resolution"
            className={`relative block object-contain select-none ${
              pan.isPanningEnabled ? "cursor-grab" : "cursor-pointer"
            } ${pan.isPanning ? "cursor-grabbing" : ""} ${
              mobile.isGestureActive ? "pointer-events-none" : ""
            }`}
            style={{
              opacity: state.isLoaded ? 1 : 0,
              transition: "opacity 1s ease",
            }}
            animate={refs.imgControls}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.1, 0.25, 1],
              type: "tween",
            }}
            onDoubleClick={zoom.handleZoomCycle}
            drag={pan.isPanningEnabled ? "x" : false} // Only allow horizontal drag when panning
            dragConstraints={pan.panConstraints}
            dragElastic={0.05}
            dragMomentum={false}
            onDragStart={() => pan.setIsPanning(true)}
            onDragEnd={() => pan.setIsPanning(false)}
            whileDrag={{ scale: 0.98 }}
          />
        )}

        <LoadingProgress isLoaded={state.isLoaded} />
        <PanHint
          show={pan.isPanningEnabled && pan.showPanHint}
          onClose={() => pan.setShowPanHint(false)}
        />
        <LoadingOverlay show={core.isPaging || false} />

        {/* Desktop Close Button - Always visible on desktop */}
        {!mobile.isMobile && (
          <button
            className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            onClick={core.onClose}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        )}

        {/* Desktop Navigation Arrows - Always visible on desktop */}
        {!mobile.isMobile && core.onPreviousImage && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            onClick={core.onPreviousImage}
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {!mobile.isMobile && core.onNextImage && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            onClick={core.onNextImage}
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Mobile swipe indicator */}
        {mobile.swipeIndicator && (
          <motion.div
            className={`absolute p-3 bg-white/20 rounded-full ${
              mobile.swipeIndicator.direction === "left"
                ? "left-4 top-1/2 -translate-y-1/2"
                : mobile.swipeIndicator.direction === "right"
                  ? "right-4 top-1/2 -translate-y-1/2"
                  : mobile.swipeIndicator.direction === "up"
                    ? "top-4 left-1/2 -translate-x-1/2"
                    : "bottom-4 left-1/2 -translate-x-1/2"
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: mobile.swipeIndicator.opacity,
              scale: mobile.swipeIndicator.scale,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {mobile.swipeIndicator.direction === "left" ? (
              <ChevronLeft size={24} className="text-white" />
            ) : mobile.swipeIndicator.direction === "right" ? (
              <ChevronRight size={24} className="text-white" />
            ) : mobile.swipeIndicator.direction === "up" ? (
              <ChevronUp size={24} className="text-white" />
            ) : (
              <ChevronDown size={24} className="text-white" />
            )}
          </motion.div>
        )}
      </div>

      {/* Zoom Controls are hidden on mobile devices - only show on desktop */}
      {!mobile.isMobile && (
        <ZoomControls
          imageZoom={zoom.imageZoom}
          onZoomChange={zoom.setImageZoom as (zoom: number) => void}
        />
      )}
      <ZoomLabel zoomLabel={zoom.zoomLabel} imageDimensions={core.imageDimensions} />
    </motion.div>
  );
}
