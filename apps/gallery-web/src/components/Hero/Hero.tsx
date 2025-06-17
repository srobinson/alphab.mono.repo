import { LoadingProgress } from "../LoadingProgress";
import type { Image } from "../../hooks/useGallery";
import { HeroImageBackground } from "./HeroImageBackground";
import { HeroTitle } from "./HeroTitle";
import { ScrollToGridButton } from "./ScrollToGridButton";

export interface HeroViewProps {
  handleTouchEnd: () => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  heroImage: Image | null;
  heroRef: React.RefObject<HTMLDivElement | null>;
  isLoaded: boolean;
  loadedSrc: string;
  onImageClick?: (image: Image) => void;
  onScrollToGrid?: () => void;
  totalImages: number;
}

export function Hero({
  handleTouchEnd,
  handleTouchMove,
  handleTouchStart,
  heroImage,
  heroRef,
  isLoaded,
  loadedSrc,
  onImageClick,
  onScrollToGrid,
  totalImages,
}: HeroViewProps) {
  return (
    <div
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden"
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <HeroImageBackground
        heroImage={heroImage}
        isLoaded={isLoaded}
        loadedSrc={loadedSrc}
        onImageClick={onImageClick}
      />
      <HeroTitle isLoaded={isLoaded} totalImages={totalImages} />
      <LoadingProgress isLoaded={isLoaded} />
      <ScrollToGridButton isLoaded={isLoaded} onScrollToGrid={onScrollToGrid} />
    </div>
  );
}
