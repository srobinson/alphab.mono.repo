import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { LoadingProgress } from "../LoadingProgress";
import { ZoomControls } from "../ZoomControls";
import { TransitionSelector } from "./TransitionSelector";
import { PanHint } from "./PanHint";
import { LoadingOverlay } from "./LoadingOverlay";
import { ZoomLabel } from "./ZoomLabel";
import { NavigationButtons } from "./NavigationButtons";
import { ModalTransitionOverlay } from "./ModalTransitionOverlay";

export type ImageModalPresentationProps = {
  image: { full: string; thumbnail: string };
  imageDimensions?: { width: number; height: number } | null;
  isPaging?: boolean;
  onClose: () => void;
  onNextImage?: () => void;
  onPreviousImage?: () => void;
  // Modal state/logic props
  loadedSrc: string;
  isLoaded: boolean;
  hasError: boolean;
  imageZoom: 1 | 2 | 3;
  setImageZoom: (z: 1 | 2 | 3) => void;
  handleZoomCycle: () => void;
  showPanHint: boolean;
  setShowPanHint: (v: boolean) => void;
  isPanning: boolean;
  setIsPanning: (v: boolean) => void;
  isExiting: boolean;
  setIsExiting: (v: boolean) => void;
  transitionType: "unzip" | "fade" | "slide";
  setTransitionType: (t: "unzip" | "fade" | "slide") => void;
  phase: "idle" | "drawing" | "splitting";
  setPhase: (p: "idle" | "drawing" | "splitting") => void;
  isUnzipping: boolean;
  setIsUnzipping: (v: boolean) => void;
  unzipDirection: "next" | "prev" | null;
  setUnzipDirection: (d: "next" | "prev" | null) => void;
  prevImage: { full: string; thumbnail: string };
  setPrevImage: (img: { full: string; thumbnail: string }) => void;
  showUnzip: boolean;
  setShowUnzip: (v: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  imgControls: any;
  imgRef: React.RefObject<any>;
  isPanningEnabled: boolean;
  panConstraints: { left: number; right: number; top: number; bottom: number };
  zoomLabel: string;
  getZoomStyles: (zoom: number) => any;
  transitions: { key: string; label: string }[];
  triggerTransition: (direction: "next" | "prev") => void;
};

export function ImageModal({
  image,
  imageDimensions,
  isPaging = false,
  onClose,
  onNextImage,
  onPreviousImage,
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
}: ImageModalPresentationProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        style={{ pointerEvents: isExiting || phase !== "idle" ? "none" : "auto" }}
        initial={{ opacity: 1 }}
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
        {/* Transition selector UI */}
        {/* <TransitionSelector
          transitions={transitions}
          transitionType={transitionType}
          onSelect={(key) => setTransitionType(key as any)}
        /> */}
        <div
          ref={containerRef}
          className="relative flex items-center justify-center w-full h-full overflow-hidden"
        >
          {/* Blurred background using low-res image */}
          <img
            src={image.thumbnail}
            alt="Loading background"
            className="absolute inset-0 w-screen h-screen object-cover transition-opacity duration-500"
            style={{
              filter: "blur(20px) saturate(.875)",
              opacity: 1,
            }}
          />
          {/* Transition overlays */}
          <ModalTransitionOverlay
            transitionType={transitionType}
            phase={phase}
            prevImage={prevImage}
            loadedSrc={loadedSrc}
            imageZoom={imageZoom}
            unzipDirection={unzipDirection}
            getZoomStyles={getZoomStyles}
          />
          {/* Main image (progressive load) */}
          {loadedSrc && (
            <motion.img
              ref={imgRef}
              src={loadedSrc}
              alt="Full resolution"
              className={`relative block object-contain select-none ${
                isPanningEnabled ? "cursor-grab" : "cursor-pointer"
              } ${isPanning ? "cursor-grabbing" : ""}`}
              style={{
                opacity: isLoaded ? 1 : 0,
                transition: "opacity 1s ease",
              }}
              animate={imgControls}
              transition={{
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
                type: "tween",
              }}
              onDoubleClick={handleZoomCycle}
              drag={isPanningEnabled}
              dragConstraints={panConstraints}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={() => setIsPanning(true)}
              onDragEnd={() => setIsPanning(false)}
              whileDrag={{ scale: 0.98 }}
            />
          )}
          <LoadingProgress isLoaded={isLoaded} />
          <PanHint show={isPanningEnabled && showPanHint} onClose={() => setShowPanHint(false)} />
          <LoadingOverlay show={isPaging} />
        </div>
        {/* <NavigationButtons
          onClose={onClose}
          onPrev={phase === "idle" && onPreviousImage ? () => triggerTransition("prev") : undefined}
          onNext={phase === "idle" && onNextImage ? () => triggerTransition("next") : undefined}
          showPrev={!!onPreviousImage}
          showNext={!!onNextImage}
          disabled={phase !== "idle"}
        /> */}
        <ZoomControls imageZoom={imageZoom} onZoomChange={setImageZoom as (zoom: number) => void} />
        <ZoomLabel zoomLabel={zoomLabel} imageDimensions={imageDimensions} />
      </motion.div>
    </AnimatePresence>
  );
}
