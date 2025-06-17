import React from "react";
import type { Image } from "../../hooks/useGallery";

export function HeroImageBackground({
  heroImage,
  isLoaded,
  loadedSrc,
  onImageClick,
}: {
  heroImage: Image | null;
  isLoaded: boolean;
  loadedSrc: string;
  onImageClick?: (image: Image) => void;
}) {
  if (!heroImage) return null;
  return (
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
  );
}
