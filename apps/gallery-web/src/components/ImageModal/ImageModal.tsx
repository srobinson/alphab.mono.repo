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
      initial={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0.05 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onClick={(e) => e.target === e.currentTarget && core.onClose()}
    >
      <div
        ref={refs.containerRef}
        className={`relative w-full h-full ${
          mobile.isMobile && zoom.imageZoom === 1 && pan.isPanningEnabled
            ? "flex items-center justify-center overflow-visible" // Keep centering but allow overflow
            : "flex items-center justify-center overflow-hidden" // Normal centering
        }`}
        style={{
          touchAction: mobile.isMobile ? "none" : "auto", // Always prevent default touch on mobile
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none", // Prevent callout
          WebkitTapHighlightColor: "transparent", // Remove tap highlight
        }}
        {...(mobile.isMobile ? mobile.mobileGestureBindings?.() || {} : {})}
        onDoubleClick={mobile.isMobile ? zoom.handleZoomCycle : undefined} // Fallback double-tap for mobile when panning
      >
        {/* Blurred background - provides visual context while main image loads */}
        <img
          src={core.image.thumbnail}
          alt="Background"
          className="absolute inset-0 w-screen h-screen object-cover"
          style={{
            filter: mobile.isMobile ? "blur(40px) saturate(.875)" : "blur(20px) saturate(.875)",
            opacity: 1,
          }}
        />

        {/* Main image - progressive loading: starts with thumbnail, switches to full res when loaded */}
        {state.loadedSrc && (
          <motion.img
            ref={refs.imgRef}
            src={state.loadedSrc}
            alt="Full resolution"
            className={`relative block ${
              mobile.isMobile && zoom.imageZoom === 1 ? "" : "object-contain"
            } select-none ${
              pan.isPanningEnabled ? "cursor-grab" : "cursor-pointer"
            } ${pan.isPanning ? "cursor-grabbing" : ""} ${
              mobile.isGestureActive ? "pointer-events-none" : ""
            }`}
            style={{
              opacity: state.isLoaded ? 1 : 0.8,
              transition: "opacity 1s ease",
              ...(mobile.isMobile && zoom.imageZoom === 1 && pan.isPanningEnabled
                ? {
                    // Force exact dimensions for mobile panning
                    width: `${core.imageDimensions?.width}px !important`,
                    height: `${core.imageDimensions?.height}px !important`,
                    maxWidth: "none !important",
                    maxHeight: "none !important",
                    minWidth: "none !important",
                    minHeight: "none !important",
                  }
                : {}),
            }}
            animate={refs.imgControls}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.1, 0.25, 1],
              type: "tween",
            }}
            onDoubleClick={zoom.handleZoomCycle}
            drag={
              pan.isPanningEnabled
                ? mobile.isMobile
                  ? true
                  : zoom.imageZoom === 3
                    ? false
                    : true
                : false
            }
            dragConstraints={pan.panConstraints}
            dragElastic={0.05}
            dragMomentum={false}
            onDragStart={() => {
              console.log("🎯 Drag Start:", {
                isPanningEnabled: pan.isPanningEnabled,
                imageZoom: zoom.imageZoom,
                isMobile: mobile.isMobile,
              });
              pan.setIsPanning(true);
            }}
            onDragEnd={() => {
              console.log("🎯 Drag End");
              pan.setIsPanning(false);
            }}
            whileDrag={{ scale: 0.98 }}
          />
        )}

        <LoadingProgress isLoaded={state.isLoaded} />
        <PanHint
          show={pan.isPanningEnabled && pan.showPanHint}
          onClose={() => pan.setShowPanHint(false)}
        />
        <LoadingOverlay show={core.isPaging || false} />

        {/* Mobile panning mode indicator */}
        {mobile.isMobile && pan.isPanningEnabled && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
            Pan to explore • Double tap to navigate
          </div>
        )}

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
