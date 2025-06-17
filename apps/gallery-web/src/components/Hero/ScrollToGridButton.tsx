import React from "react";
import { ChevronDown } from "lucide-react";

export function ScrollToGridButton({
  isLoaded,
  onScrollToGrid,
}: {
  isLoaded: boolean;
  onScrollToGrid?: () => void;
}) {
  return (
    <button
      onClick={onScrollToGrid}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/80 hover:text-white transition-colors"
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 1s ease 0.5s",
      }}
    >
      <ChevronDown size={48} className="animate-bounce" />
    </button>
  );
}
