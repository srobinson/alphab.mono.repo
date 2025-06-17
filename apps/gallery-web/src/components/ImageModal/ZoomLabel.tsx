import { motion } from "framer-motion";
import React from "react";

export function ZoomLabel({
  zoomLabel,
  imageDimensions,
}: {
  zoomLabel: string;
  imageDimensions?: { width: number; height: number } | null;
}) {
  return (
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
  );
}
