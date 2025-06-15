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
  imageRef?: React.Ref<HTMLDivElement>;
}

export const GalleryImage = memo(
  ({ image, index, onClick, isSelected, imageRef }: GalleryImageProps) => {
    const localRef = useRef<HTMLDivElement>(null);
    const ref = imageRef || localRef;

    // Scroll selected image into view
    useEffect(() => {
      if (isSelected && ref && "current" in ref && ref.current) {
        ref.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }, [isSelected, ref]);

    return (
      <motion.div
        key={`${image.thumbnail}-${index}`}
        className={`masonry-item ${isSelected ? "selected" : ""}`}
        layoutId={`card-${image.thumbnail}`}
        onClick={() => onClick(image)}
        ref={ref}
        style={{
          border: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
          transition: "border-color 0.3s ease",
          boxShadow: isSelected ? "2px 2px 4px rgba(59, 130, 246, 0.5)" : "none",
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
