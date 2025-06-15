import { useState, useEffect, useMemo, useRef, memo } from "react";
import { ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

import { useImageLoader } from "./hooks/use-image-loader";
import { useImageGallery } from "./hooks/use-image-gallery";
import { SimpleMasonry } from "./hooks/use-masonary-hook";
import { Hero } from "./components/Hero";
import { GalleryGrid } from "./components/GalleryGrid";
import { ImageModal } from "./components/ImageModal";
import { ImageCounter } from "./components/ImageCounter";
import "./gallery.css";

// Gallery image component for rendering individual images in the masonry grid
const GalleryImage = memo(
  ({
    image,
    index,
    onClick,
    isSelected,
    imageRef,
  }: {
    image: Image;
    index: number;
    onClick: (image: Image) => void;
    isSelected: boolean;
    imageRef?: React.Ref<HTMLDivElement>;
  }) => {
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

// Modal image component with zoom and pan functionality
const ModalImage = ({
  image,
  imageZoom,
  onDoubleClick,
  imageDimensions,
  showPanHint,
  onDismissPanHint,
}: {
  image: Image;
  imageZoom: number;
  onDoubleClick: () => void;
  imageDimensions?: { width: number; height: number } | null;
  showPanHint: boolean;
  onDismissPanHint: () => void;
}) => {
  const { src: loadedSrc, isLoaded } = useImageLoader(image.thumbnail, image.full);

  const [isPanning, setIsPanning] = useState(false);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset pan position on zoom or image change
  useEffect(() => {
    panX.set(0);
    panY.set(0);
  }, [imageZoom, image.full, panX, panY]);

  // Determine if panning is enabled based on image size and zoom level
  const isPanningEnabled = useMemo(() => {
    if (!imageDimensions || imageZoom === 3) return false;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;

    if (imageZoom === 1) {
      return imgWidth > viewportWidth || imgHeight > viewportHeight;
    } else if (imageZoom === 2) {
      const scaledHeight = (imgHeight * viewportWidth) / imgWidth;
      return scaledHeight > viewportHeight;
    }

    return false;
  }, [imageDimensions, imageZoom]);

  // Calculate zoom styles based on zoom level
  const getZoomStyles = (zoom: number) => {
    if (!imageDimensions) {
      switch (zoom) {
        case 1:
          return { width: "auto", height: "auto", maxWidth: "90vw", maxHeight: "90vh" };
        case 2:
          return { width: "100vw", height: "auto" };
        case 3:
          return { width: "auto", height: "100vh" };
        default:
          return { width: "auto", height: "auto", maxWidth: "90vw", maxHeight: "90vh" };
      }
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;

    switch (zoom) {
      case 1:
        return {
          width: imgWidth,
          height: imgHeight,
          maxWidth: "unset",
          maxHeight: "unset",
        };
      case 2:
        return {
          width: viewportWidth,
          height: (imgHeight * viewportWidth) / imgWidth,
          maxWidth: "unset",
          maxHeight: "unset",
        };
      case 3:
        return {
          width: (imgWidth * viewportHeight) / imgHeight,
          height: viewportHeight,
        };
      default:
        return { width: "unset", height: "unset" };
    }
  };

  // Calculate panning constraints
  const getPanConstraints = () => {
    if (!imageDimensions || !isPanningEnabled) {
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { width: imgWidth, height: imgHeight } = imageDimensions;

    let displayWidth: number, displayHeight: number;

    if (imageZoom === 1) {
      displayWidth = imgWidth;
      displayHeight = imgHeight;
    } else if (imageZoom === 2) {
      displayWidth = viewportWidth;
      displayHeight = (imgHeight * viewportWidth) / imgWidth;
    } else {
      displayWidth = (imgWidth * viewportHeight) / imgHeight;
      displayHeight = viewportHeight;
    }

    const maxPanX = Math.max(0, (displayWidth - viewportWidth) / 2);
    const maxPanY = Math.max(0, (displayHeight - viewportHeight) / 2);

    return {
      left: -maxPanX,
      right: maxPanX,
      top: -maxPanY,
      bottom: maxPanY,
    };
  };

  const panConstraints = getPanConstraints();

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full overflow-hidden"
    >
      <img
        src={image.thumbnail}
        alt="Loading background"
        className="absolute inset-0 w-screen h-screen object-cover transition-opacity duration-500"
        style={{
          filter: "blur(20px) saturate(.5)",
          transform: "scale(1.1)",
          opacity: 1,
        }}
      />
      <motion.img
        src={loadedSrc}
        alt="Full resolution"
        className={`relative block object-contain select-none ${
          isPanningEnabled ? "cursor-grab" : "cursor-pointer"
        } ${isPanning ? "cursor-grabbing" : ""}`}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 1s ease",
          x: panX,
          y: panY,
        }}
        animate={getZoomStyles(imageZoom)}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1],
          type: "tween",
        }}
        onDoubleClick={onDoubleClick}
        drag={isPanningEnabled}
        dragConstraints={panConstraints}
        dragElastic={0.05}
        dragMomentum={false}
        onDragStart={() => setIsPanning(true)}
        onDragEnd={() => setIsPanning(false)}
        whileDrag={{ scale: 0.98 }}
      />
      <LoadingProgress isLoaded={isLoaded} />
      {isPanningEnabled && isLoaded && showPanHint && (
        <motion.div
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 px-3 py-2 rounded-lg bg-black/70 text-white text-sm pointer-events-auto flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 1, duration: 2 }}
        >
          <span>Drag to pan • Double-click to zoom</span>
          <button
            onClick={() => onDismissPanHint()}
            className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
            title="Don't show again"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </div>
  );
};

// Loading progress bar for images
function LoadingProgress({ isLoaded }: { isLoaded: boolean }) {
  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
          initial={{ opacity: 0, paddingTop: "10vw" }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-[50vw] max-w-sm h-[3px] bg-white/10 rounded-full shadow-lg border border-white/20 overflow-hidden">
            <motion.div
              className="h-full bg-white/80 rounded-full"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface Image {
  full: string;
  thumbnail: string;
}

function App() {
  const {
    paginatedImages,
    currentIndex,
    totalImages,
    isLoading,
    error,
    nextImage,
    previousImage,
    goToImage,
    setCurrentImage,
    getRandomImage,
    findImageIndex,
    getImageDimensions,
    currentPage,
    totalPages,
    nextPage,
    previousPage,
  } = useImageGallery();

  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [lastViewedImage, setLastViewedImage] = useState<Image | null>(null);
  const [imageZoom, setImageZoom] = useState(2);
  const [direction, setDirection] = useState(0);
  const [showPanHint, setShowPanHint] = useState(true);
  const [isPaging, setIsPaging] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const galleryGridRef = useRef<HTMLDivElement>(null);
  const lastImageRef = useRef<HTMLDivElement>(null);

  // Select first image as hero image
  const heroImage = useMemo(() => {
    return paginatedImages.length > 0 ? paginatedImages[0] : null;
  }, [paginatedImages]);

  // Get dimensions for selected image
  const selectedImageDimensions = useMemo(() => {
    if (!selectedImage) return null;
    return getImageDimensions(selectedImage);
  }, [selectedImage, getImageDimensions]);

  // Reset isPaging when images are loaded
  useEffect(() => {
    const handleImagesLoaded = () => {
      setIsPaging(false);
    };

    window.addEventListener("imagesLoaded", handleImagesLoaded);
    return () => {
      window.removeEventListener("imagesLoaded", handleImagesLoaded);
    };
  }, []);

  // Infinite scroll: Load next page when near bottom
  useEffect(() => {
    if (currentPage >= totalPages || isLoading || isPaging) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      const triggerDistance = 500;

      if (pageHeight - scrollPosition < triggerDistance && !isPaging) {
        setIsPaging(true);
        nextPage();
      }
    };

    const debouncedScroll = debounce(handleScroll, 300);
    window.addEventListener("scroll", debouncedScroll);

    return () => {
      window.removeEventListener("scroll", debouncedScroll);
    };
  }, [currentPage, totalPages, isLoading, isPaging, nextPage]);

  // Handle next page button click
  const handleNextPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentPage >= totalPages || isLoading || isPaging) {
      return;
    }
    setIsPaging(true);
    nextPage();
  };

  // Handle previous page button click
  const handlePreviousPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentPage <= 1 || isLoading || isPaging) {
      return;
    }
    previousPage();
  };

  // Modal open if selectedImage is not null
  const isModalOpen = !!selectedImage;

  // Find index of selectedImage in paginatedImages
  const selectedIndex = selectedImage
    ? paginatedImages.findIndex((img) => img.thumbnail === selectedImage.thumbnail)
    : -1;

  // Modal navigation
  const handleNextImage = () => {
    if (selectedIndex === -1) return;
    if (selectedIndex + 1 < paginatedImages.length) {
      setSelectedImage(paginatedImages[selectedIndex + 1]);
    } else if (paginatedImages.length < totalImages) {
      // At end, fetch next page
      nextPage();
    }
  };
  const handlePreviousImage = () => {
    if (selectedIndex > 0) {
      setSelectedImage(paginatedImages[selectedIndex - 1]);
    }
  };

  // Keyboard navigation for modal
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextImage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePreviousImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, selectedIndex, paginatedImages.length, totalImages]);

  // When new images are loaded and user was at end, auto-advance
  useEffect(() => {
    if (!isModalOpen || selectedIndex !== paginatedImages.length - 2) return;
    if (paginatedImages.length > selectedIndex + 1) {
      setSelectedImage(paginatedImages[selectedIndex + 1]);
    }
  }, [paginatedImages.length]);

  // Handle image click to open modal
  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  // Handle modal close
  const handleModalClose = () => {
    if (selectedImage) setLastViewedImage(selectedImage);
    setSelectedImage(null);
  };

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
            setImageZoom(2); // Set initial zoom level
          }
        }
      }
    };

    const heroElement = heroRef.current;
    heroElement?.addEventListener("keydown", handleHeroKeyDown);
    return () => heroElement?.removeEventListener("keydown", handleHeroKeyDown);
  }, [heroImage]);

  // Handle hero image navigation
  const handleHeroImageChange = (direction: "prev" | "next") => {
    if (!heroImage) return;

    const currentIndex = findImageIndex(heroImage);
    if (currentIndex === -1) return;

    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= paginatedImages.length) return;

    const nextImg = paginatedImages[nextIndex];
    if (nextImg) {
      setCurrentImage(nextImg);
    }
  };

  // Scroll to gallery grid
  const scrollToGallery = () => {
    document.getElementById("gallery-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  // Cycle through zoom levels
  const handleZoomCycle = () => {
    setImageZoom((prev) => {
      const nextZoom = prev === 1 ? 2 : prev === 2 ? 3 : 1;
      return nextZoom;
    });
  };

  // Get zoom level label
  const getZoomLabel = () => {
    switch (imageZoom) {
      case 1:
        return "Original Size";
      case 2:
        return "Fit Width";
      case 3:
        return "Fit Height";
      default:
        return "Original Size";
    }
  };

  // Update selected image when new page loads
  useEffect(() => {
    if (selectedImage && isPaging) {
      const currentIndex = findImageIndex(selectedImage);
      if (currentIndex === -1) {
        // If the current image is not in the new page, select the first image
        if (paginatedImages.length > 0) {
          setSelectedImage(paginatedImages[0]);
          setCurrentImage(paginatedImages[0]);
        }
      }
    }
  }, [paginatedImages, selectedImage, isPaging]);

  // Loading state for initial page
  if (isLoading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading gallery...</p>
          <p className="text-sm text-white/60 mt-2">
            {totalImages > 0 ? `Fetching ${totalImages} images...` : "Fetching images..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Failed to Load Gallery</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!paginatedImages.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🖼️</div>
          <p className="text-lg">No images found in gallery</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Hero
        heroImage={heroImage}
        totalImages={totalImages}
        onImageClick={handleImageClick}
        onImageChange={handleHeroImageChange}
        onScrollToGrid={scrollToGallery}
        setCurrentImage={setCurrentImage}
        isModalOpen={isModalOpen}
      />
      <GalleryGrid
        images={paginatedImages}
        heroImage={heroImage}
        onImageClick={handleImageClick}
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalImages={totalImages}
        isPaging={isPaging}
        lastViewedImage={lastViewedImage}
      />
      <AnimatePresence>
        {isModalOpen && selectedImage && (
          <>
            <ImageModal
              image={selectedImage}
              onClose={handleModalClose}
              imageZoom={imageZoom}
              onDoubleClick={handleZoomCycle}
              imageDimensions={selectedImageDimensions}
              showPanHint={showPanHint}
              onDismissPanHint={() => setShowPanHint(false)}
              zoomLabel={getZoomLabel()}
              onZoomChange={setImageZoom}
              onNextImage={handleNextImage}
              onPreviousImage={handlePreviousImage}
            />
            <ImageCounter
              currentIndex={selectedIndex + 1}
              totalImages={totalImages}
              isLoading={isPaging}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Debounce function to limit rapid calls
const debounce = (func: () => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func();
      timeoutId = null;
    }, delay);
  };
};

export default App;
