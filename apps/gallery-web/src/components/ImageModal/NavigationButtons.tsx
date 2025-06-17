import React from "react";
import { X } from "lucide-react";

export function NavigationButtons({
  onClose,
  onNext,
  onPrev,
  showNext,
  showPrev,
  disabled,
}: {
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  showNext?: boolean;
  showPrev?: boolean;
  disabled?: boolean;
}) {
  return (
    <>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>
      {showPrev && onPrev && (
        <button
          className="modal-nav-button left-4"
          onClick={onPrev}
          disabled={disabled}
          aria-label="Previous image"
        >
          &#8592;
        </button>
      )}
      {showNext && onNext && (
        <button
          className="modal-nav-button right-4"
          onClick={onNext}
          disabled={disabled}
          aria-label="Next image"
        >
          &#8594;
        </button>
      )}
    </>
  );
}
