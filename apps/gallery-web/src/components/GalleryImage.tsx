import { useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";

interface Image {
  full: string;
  thumbnail: string;
}

interface GalleryImageProps {
  image: Image;
  index: number;
  onClick: (image: Image) => void;
  isSelected: boolean;
}

export const GalleryImage = memo(
  ({ image, index, onClick, isSelected }: GalleryImageProps) => {
    const ref = useRef<HTMLDivElement>(null);

    // Scroll selected image into view
    useEffect(() => {
      if (isSelected && ref.current) {
        ref.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }, [isSelected]);

    return (
      <motion.div
        key={`${image.thumbnail}-${index}`}
        className={`masonry-item ${isSelected ? "selected" : ""}`}
        layoutId={`card-${image.thumbnail}`}
        onClick={() => onClick(image)}
        ref={ref}
        style={{
          border: isSelected ? "3px solid #fff" : "3px solid transparent",
          transition: "border-color 0.3s ease",
          boxShadow: isSelected ? "1px 1px 15px rgba(255, 255, 246 , 0.75)" : "none",
        }}
      >
        <img
          src={image.thumbnail}
          alt="Gallery background"
          className="gallery-image gallery-image-bg w-full"
          loading="lazy"
        />
        <img
          src={image.thumbnail}
          alt="Gallery foreground"
          className="gallery-image gallery-image-fg w-full"
          loading="lazy"
        />
      </motion.div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.image.thumbnail === nextProps.image.thumbnail &&
    prevProps.index === nextProps.index &&
    prevProps.isSelected === nextProps.isSelected,
);
