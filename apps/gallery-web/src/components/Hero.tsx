import { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useImageLoader } from "../hooks/use-image-loader";
import { LoadingProgress } from "./LoadingProgress";
import { motion } from "framer-motion";

interface Image {
  full: string;
  thumbnail: string;
}

interface HeroProps {
  heroImage: Image | null;
  totalImages: number;
  onScrollToGrid: () => void;
  onImageClick: () => void;
  setSelectedImage: (image: any) => void;
  setCurrentImage: (image: any) => void;
}

export function Hero({
  heroImage,
  totalImages,
  onScrollToGrid,
  onImageClick,
  setSelectedImage,
  setCurrentImage,
}: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);

  // Load hero image
  const { src: heroSrc, isLoaded: isHeroLoaded } = useImageLoader(
    heroImage?.thumbnail,
    heroImage?.full,
  );

  // Hero section keyboard navigation to gallery or modal
  useEffect(() => {
    const handleHeroKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === heroRef.current) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          document.getElementById("gallery-grid")?.focus();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          if (heroImage) {
            setSelectedImage(heroImage);
            setCurrentImage(heroImage);
          }
        }
      }
    };

    document.addEventListener("keydown", handleHeroKeyDown);
    return () => {
      document.removeEventListener("keydown", handleHeroKeyDown);
    };
  }, [heroImage, setSelectedImage, setCurrentImage]);

  return (
    <header
      ref={heroRef}
      tabIndex={0}
      className="h-screen w-full relative flex flex-col items-center justify-center text-white overflow-hidden"
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
              opacity: isHeroLoaded ? 0 : 1,
              transition: "opacity 0.5s ease",
            }}
            loading="lazy"
          />
          {heroSrc && (
            <img
              src={heroSrc}
              alt="Main content"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: isHeroLoaded ? 1 : 0,
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
          fontSize: isHeroLoaded ? "8vw" : "10vw",
          opacity: isHeroLoaded ? 0 : 0.8,
          transform: isHeroLoaded ? "translateY(0) scale(1)" : "translateY(4px) scale(1.1)",
          transition:
            "font-size ease-out .100s 1.3s, transform ease-out .500s 1.3s, opacity ease-out 1s 1.3s",
        }}
      >
        <h1 className="md:text-10xl pb-0 font-bold tracking-tighter">Ephemeral Art</h1>
        <p className="text-lg md:text-xl text-white/90">
          A curated collection of {totalImages} textures and patterns.
        </p>
      </div>
      <LoadingProgress isLoaded={isHeroLoaded} />
      <button
        onClick={onScrollToGrid}
        className="absolute bottom-10 z-20 text-white/80 hover:text-white transition-colors"
        style={{
          opacity: isHeroLoaded ? 1 : 0,
          transition: "opacity 1s ease 0.5s",
        }}
      >
        <ChevronDown size={48} className="animate-bounce" />
      </button>
    </header>
  );
}
