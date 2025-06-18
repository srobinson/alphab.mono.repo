import { useState, useEffect, useRef, useMemo } from "react";
import { useImageLoader } from "../../hooks/use-image-loader";
import type { Image } from "../../hooks/useGallery";

export interface HeroProps {
  heroImage: Image | null;
  totalImages: number;
  onImageClick?: (image: Image) => void;
  onImageChange?: (direction: "prev" | "next") => void;
  onScrollToGrid?: () => void;
  setCurrentImage: (image: Image) => void;
  isModalOpen?: boolean;
}

export function useHero({
  heroImage,
  totalImages,
  onImageClick,
  onImageChange,
  onScrollToGrid,
  setCurrentImage,
  isModalOpen = false,
}: HeroProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { src: loadedSrc, isLoaded } = useImageLoader(heroImage?.thumbnail, heroImage?.full);

  // Handle keyboard navigation
  useEffect(() => {
    const handleHeroKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      if (e.key === "ArrowDown") {
        if (window.scrollY === 0) {
          e.preventDefault();
          if (onScrollToGrid) onScrollToGrid();
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (window.scrollY === 0) {
          e.preventDefault();
          console.log("heroImage", heroImage);
          if (heroImage) {
            if (onImageClick) onImageClick(heroImage);
            setCurrentImage(heroImage);
          }
        }
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (onImageClick && heroImage) onImageClick(heroImage);
      }
    };
    document.addEventListener("keydown", handleHeroKeyDown);
    return () => {
      document.removeEventListener("keydown", handleHeroKeyDown);
    };
  }, [heroImage, onImageChange, onScrollToGrid, onImageClick, isModalOpen, setCurrentImage]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.touches[0];
    const diff = touchStart - touch.clientX;
    if (Math.abs(diff) > 50) {
      // On mobile swipe left/right opens modal with hero image
      onImageClick(heroImage);
      setCurrentImage(heroImage);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  return {
    heroRef,
    loadedSrc,
    isLoaded,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    heroImage,
    totalImages,
    onImageClick,
    onScrollToGrid,
  };
}
