import { motion } from "framer-motion";

interface ZoomControlsProps {
  imageZoom: number;
  onZoomChange: (zoom: number) => void;
}

export function ZoomControls({ imageZoom, onZoomChange }: ZoomControlsProps) {
  return (
    <motion.div
      className="absolute bottom-4 right-4 z-20 flex gap-2"
      initial={{ opacity: 1, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, transition: { delay: 0.3 } }}
      exit={{ opacity: 1, scale: 0.95 }}
    >
      <button
        onClick={() => onZoomChange(1)}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${
          imageZoom === 1
            ? "bg-white/30 text-white"
            : "bg-black/30 text-white/70 hover:text-white hover:bg-black/50"
        }`}
      >
        Original
      </button>
      <button
        onClick={() => onZoomChange(2)}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${
          imageZoom === 2
            ? "bg-white/30 text-white"
            : "bg-black/30 text-white/70 hover:text-white hover:bg-black/50"
        }`}
      >
        Fit Width
      </button>
      <button
        onClick={() => onZoomChange(3)}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${
          imageZoom === 3
            ? "bg-white/30 text-white"
            : "bg-black/30 text-white/70 hover:text-white hover:bg-black/50"
        }`}
      >
        Fit Height
      </button>
    </motion.div>
  );
}
