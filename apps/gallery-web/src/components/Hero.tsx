import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useImageLoader } from "../hooks/use-image-loader";
import { LoadingProgress } from "./LoadingProgress";
import { motion, AnimatePresence } from "framer-motion";

interface Image {
  full: string;
  thumbnail: string;
}

interface HeroProps {
  heroImage: Image | null;
  totalImages: number;
  onImageClick?: (image: Image) => void;
  onImageChange?: (direction: "prev" | "next") => void;
  onScrollToGrid?: () => void;
  setSelectedImage: (image: any) => void;
  setCurrentImage: (image: any) => void;
}

export const Hero = ({
  heroImage,
  totalImages,
  onImageClick,
  onImageChange,
  onScrollToGrid,
  setSelectedImage,
  setCurrentImage,
}: HeroProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { isLoaded } = useImageLoader(heroImage?.full || "");

  // Handle keyboard navigation
  const handleHeroKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (onScrollToGrid) onScrollToGrid();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (onImageChange) onImageChange("prev");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (onImageChange) onImageChange("next");
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onImageClick && heroImage) onImageClick(heroImage);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleHeroKeyDown);
    return () => {
      document.removeEventListener("keydown", handleHeroKeyDown);
    };
  }, [heroImage, onImageChange, onScrollToGrid, onImageClick]);

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const diff = touchStart - touch.clientX;

    // Only handle horizontal swipes
    if (Math.abs(diff) > 50) {
      if (diff > 0 && onImageChange) {
        onImageChange("next");
      } else if (diff < 0 && onImageChange) {
        onImageChange("prev");
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  return (
    <div
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden bg-black"
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {heroImage && (
        <>
          <img
            src={heroImage.thumbnail}
            alt="Loading background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: "blur(20px) saturate(0.8)",
              transform: "scale(1.1)",
              opacity: isLoaded ? 0 : 1,
              transition: "opacity 0.5s ease",
            }}
            loading="lazy"
          />
          {heroImage.full && (
            <img
              src={heroImage.full}
              alt="Main content"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: isLoaded ? 1 : 0,
                transition: "opacity ease 1.5s",
              }}
              loading="lazy"
            />
          )}
        </>
      )}
      <div
        className="relative z-20 text-center p-4"
        style={{
          fontSize: isLoaded ? "8vw" : "10vw",
          opacity: isLoaded ? 0 : 0.8,
          transform: isLoaded ? "translateY(0) scale(1)" : "translateY(4px) scale(1.1)",
          transition:
            "font-size ease-out .100s 1.3s, transform ease-out .500s 1.3s, opacity ease-out 1s 1.3s",
        }}
      >
        <h1 className="md:text-10xl pb-0 font-bold tracking-tighter">Ephemeral Art</h1>
        <p className="text-lg md:text-xl text-white/90">
          A curated collection of {totalImages} textures and patterns.
        </p>
      </div>
      <LoadingProgress isLoaded={isLoaded} />
      <button
        onClick={onScrollToGrid}
        className="absolute bottom-10 z-20 text-white/80 hover:text-white transition-colors"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 1s ease 0.5s",
        }}
      >
        <ChevronDown size={48} className="animate-bounce" />
      </button>
    </div>
  );
};
