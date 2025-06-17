import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Image } from "../hooks/useGallery";
import { isMobileDevice } from "../utils/device";

export type ZoomLevel = 1 | 2 | 3;

interface GalleryContextType {
  // Modal state
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;

  // Image selection
  currentIndex: number;
  setCurrentIndex: (index: number) => void;

  // Zoom state (persistent, mobile/desktop aware)
  imageZoom: ZoomLevel;
  setImageZoom: (zoom: ZoomLevel) => void;

  // Mobile preferences
  showPanHint: boolean;
  setShowPanHint: (show: boolean) => void;

  // Navigation helpers
  canGoNext: boolean;
  canGoPrevious: boolean;

  // Touch gesture state
  isGestureActive: boolean;
  setGestureActive: (active: boolean) => void;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

interface GalleryProviderProps {
  children: ReactNode;
  totalImages: number;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function GalleryProvider({
  children,
  totalImages,
  currentIndex,
  onIndexChange,
}: GalleryProviderProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isGestureActive, setGestureActive] = useState(false);

  // Persistent zoom preference - separate for mobile and desktop
  const [imageZoom, setImageZoomState] = useState<ZoomLevel>(() => {
    if (typeof window !== "undefined") {
      const isMobile = isMobileDevice();
      const storageKey = isMobile ? "gallery-mobile-zoom" : "gallery-desktop-zoom";
      const defaultZoom = isMobile ? 3 : 2; // Mobile: Fit Height, Desktop: Fit Width

      const saved = localStorage.getItem(storageKey);
      const parsedZoom = saved ? parseInt(saved, 10) : defaultZoom;
      const validZoom =
        parsedZoom === 1 || parsedZoom === 2 || parsedZoom === 3 ? parsedZoom : defaultZoom;

      // Only log mobile context initialization for debugging
      if (isMobile) {
        console.log("🎯 Mobile Gallery Context Init:", { storageKey, defaultZoom, validZoom });
      }
      return validZoom;
    }
    return 2;
  });

  // Persistent pan hint preference
  const [showPanHint, setShowPanHintState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gallery-show-pan-hint");
      return saved !== "false"; // Show by default
    }
    return true;
  });

  // Save zoom preference to localStorage with mobile/desktop awareness
  const setImageZoom = (zoom: ZoomLevel) => {
    setImageZoomState(zoom);
    if (typeof window !== "undefined") {
      const isMobile = isMobileDevice();
      const storageKey = isMobile ? "gallery-mobile-zoom" : "gallery-desktop-zoom";
      localStorage.setItem(storageKey, zoom.toString());
      // Only log mobile zoom changes for debugging
      if (isMobile) {
        console.log("🎯 Mobile Zoom Saved:", { storageKey, zoom });
      }
    }
  };

  // Save pan hint preference
  const setShowPanHint = (show: boolean) => {
    setShowPanHintState(show);
    if (typeof window !== "undefined") {
      localStorage.setItem("gallery-show-pan-hint", show.toString());
    }
  };

  // Navigation state
  const canGoNext = currentIndex < totalImages - 1;
  const canGoPrevious = currentIndex > 0;

  // Update parent index when changed
  const setCurrentIndex = (index: number) => {
    onIndexChange(index);
  };

  const value: GalleryContextType = {
    isModalOpen,
    setModalOpen,
    currentIndex,
    setCurrentIndex,
    imageZoom,
    setImageZoom,
    showPanHint,
    setShowPanHint,
    canGoNext,
    canGoPrevious,
    isGestureActive,
    setGestureActive,
  };

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGalleryContext() {
  const context = useContext(GalleryContext);
  if (context === undefined) {
    throw new Error("useGalleryContext must be used within a GalleryProvider");
  }
  return context;
}
