import React from "react";

export function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-black/80 text-white text-sm flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <span>Fetching more images...</span>
    </div>
  );
}
