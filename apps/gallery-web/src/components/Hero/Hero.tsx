import { ChevronDown } from "lucide-react";
import { LoadingProgress } from "../LoadingProgress";
import type { Image } from "./useHero";

export interface HeroViewProps {
  heroRef: React.RefObject<HTMLDivElement | null>;
  loadedSrc: string;
  isLoaded: boolean;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  heroImage: Image | null;
  totalImages: number;
  onImageClick?: (image: Image) => void;
  onScrollToGrid?: () => void;
}

export function Hero({
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
}: HeroViewProps) {
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
          <img
            src={loadedSrc}
            alt="Main content"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              cursor: onImageClick ? "pointer" : undefined,
              opacity: isLoaded ? 1 : 0,
              transition: "opacity ease 1.5s",
            }}
            loading="lazy"
            onClick={onImageClick ? () => onImageClick(heroImage) : undefined}
          />
        </>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="text-center p-4"
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
      </div>
      <LoadingProgress isLoaded={isLoaded} />
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
    </div>
  );
}
