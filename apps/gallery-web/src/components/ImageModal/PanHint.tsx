import { motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";

export function PanHint({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null;
  return (
    <motion.div
      className="absolute bottom-20 mx-auto z-10 px-3 py-2 rounded-lg bg-black/70 text-white text-sm pointer-events-auto flex items-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 1, duration: 0.3 }}
    >
      <span>Drag to pan</span>
      <button
        onClick={onClose}
        className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
        title="Don't show again"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
