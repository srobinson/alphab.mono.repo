import { motion } from "framer-motion";
import React from "react";

export function ModalTransitionOverlay({
  transitionType,
  phase,
  prevImage,
  loadedSrc,
  imageZoom,
  unzipDirection,
  getZoomStyles,
}: any) {
  if (phase !== "drawing" && phase !== "splitting") return null;
  switch (transitionType) {
    case "unzip":
      return (
        <div className="absolute inset-0 z-50 pointer-events-none">
          {/* Left half */}
          <motion.div
            className="absolute top-0 left-0 h-full w-1/2 overflow-hidden"
            initial={{ x: 0 }}
            animate={{ x: phase === "splitting" ? "-100%" : 0 }}
            transition={{ duration: 0.4, delay: 0.0, ease: [0.7, 0, 0.84, 0] }}
            style={{ zIndex: 2 }}
          >
            {/* Center line */}
            <motion.div
              className="absolute top-0 right-0 z-10 w-3 h-full bg-black/60"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.2, ease: "easeIn" }}
              style={{ transformOrigin: "top center" }}
            />
            <div
              style={{
                width: "200%",
                height: "100%",
                position: "absolute",
                left: 0,
                top: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src={prevImage.full} alt="Unzip left" style={getZoomStyles(imageZoom)} />
            </div>
          </motion.div>
          {/* Right half */}
          <motion.div
            className="absolute top-0 right-0 h-full w-1/2 overflow-hidden"
            initial={{ x: 0 }}
            animate={{ x: phase === "splitting" ? "100%" : 0 }}
            transition={{ duration: 0.4, delay: 0.0, ease: [0.7, 0, 0.84, 0] }}
            style={{ zIndex: 2 }}
          >
            {/* Center line */}
            <motion.div
              className="absolute top-0 left-0 z-10 w-3 h-full bg-black/60"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.2, ease: "easeIn" }}
              style={{ transformOrigin: "top center" }}
            />
            <div
              style={{
                width: "200%",
                height: "100%",
                position: "absolute",
                left: "-100%",
                top: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src={prevImage.full} alt="Unzip right" style={getZoomStyles(imageZoom)} />
            </div>
          </motion.div>
        </div>
      );
    case "fade":
      return null;
    case "slide": {
      return (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ x: 0 }}
            animate={{ x: unzipDirection === "next" ? "100%" : "-100%" }}
            transition={{ duration: 0.4 }}
            style={{ width: "100%", height: "100%" }}
          >
            <img src={prevImage.full} alt="Slide out" style={getZoomStyles(imageZoom)} />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ x: unzipDirection === "next" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            transition={{ duration: 0.4 }}
            style={{ width: "100%", height: "100%" }}
          >
            <img src={loadedSrc} alt="Slide in" style={getZoomStyles(imageZoom)} />
          </motion.div>
        </div>
      );
    }
    default:
      return null;
  }
}
