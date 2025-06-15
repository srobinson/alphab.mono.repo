import { useState, useEffect, useMemo, useRef, memo } from "react";
import { ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

import { useImageLoader } from "./hooks/use-image-loader";
import { useImageGallery } from "./hooks/use-image-gallery";
import { SimpleMasonry } from "./hooks/use-masonary-hook";
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
  // Gallery hook providing paginated images and navigation
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
  const [isPaging, setIsPaging] = useState(false); // Lock to prevent concurrent page changes
  const heroRef = useRef<HTMLDivElement>(null);
  const galleryGridRef = useRef<HTMLDivElement>(null);
  const lastImageRef = useRef<HTMLDivElement>(null);

  // Select first image as hero image
  const heroImage = useMemo(() => {
    return paginatedImages.length > 0 ? paginatedImages[0] : null;
  }, [paginatedImages]);

  // Load hero image
  const { src: heroSrc, isLoaded: isHeroLoaded } = useImageLoader(
    heroImage?.thumbnail,
    heroImage?.full,
  );

  // Filter out hero image from gallery
  const galleryImages = useMemo(() => {
    if (!heroImage) return paginatedImages || [];
    return paginatedImages.filter((img) => img.thumbnail !== heroImage.thumbnail);
  }, [paginatedImages, heroImage]);

  // Get dimensions for selected image
  const selectedImageDimensions = useMemo(() => {
    if (!selectedImage) return null;
    return getImageDimensions(selectedImage);
  }, [selectedImage, getImageDimensions]);

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

  // Navigate to next/previous image in modal
  const changeImage = (direction: number) => {
    if (!selectedImage) return;

    const currentSelectedIndex = findImageIndex(selectedImage);
    if (currentSelectedIndex === -1) return;

    goToImage(currentSelectedIndex);
    const nextImg = direction > 0 ? nextImage() : previousImage();

    if (nextImg) {
      setSelectedImage(nextImg);
      setDirection(direction);
    }
  };

  // Close modal and track last viewed image
  const handleModalClose = () => {
    if (selectedImage) {
      setLastViewedImage(selectedImage);
    }
    setSelectedImage(null);
  };

  // Keyboard navigation for modal and random image selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleModalClose();
      } else if (e.key === "ArrowRight") {
        changeImage(1);
      } else if (e.key === "ArrowLeft") {
        changeImage(-1);
      } else if (e.key === " ") {
        e.preventDefault();
        if (selectedImage) {
          handleZoomCycle();
        } else {
          const randomImg = getRandomImage();
          if (randomImg) {
            setSelectedImage(randomImg);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

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

    const heroElement = heroRef.current;
    heroElement?.addEventListener("keydown", handleHeroKeyDown);
    return () => heroElement?.removeEventListener("keydown", handleHeroKeyDown);
  }, [heroImage]);

  // Scroll to gallery grid
  const scrollToGrid = () => {
    document.getElementById("gallery-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle image click to open modal
  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
    setCurrentImage(image);
    setLastViewedImage(null);
  };

  // Cycle through zoom levels
  const handleZoomCycle = () => {
    setImageZoom((prev) => {
      const nextZoom = prev === 1 ? 2 : prev === 2 ? 3 : 1;
      return nextZoom;
    });
  };

  // Get zoom level label
  const getZoomLabel = (zoom: number) => {
    switch (zoom) {
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

  // Zoom controls component
  const ZoomControls = () => (
    <motion.div
      className="absolute bottom-4 right-4 z-20 flex gap-2"
      initial={{ opacity: 1, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, transition: { delay: 0.3 } }}
      exit={{ opacity: 1, scale: 0.95 }}
    >
      <button
        onClick={() => setImageZoom(1)}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${
          imageZoom === 1
            ? "bg-white/30 text-white"
            : "bg-black/30 text-white/70 hover:text-white hover:bg-black/50"
        }`}
      >
        Original
      </button>
      <button
        onClick={() => setImageZoom(2)}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${
          imageZoom === 2
            ? "bg-white/30 text-white"
            : "bg-black/30 text-white/70 hover:text-white hover:bg-black/50"
        }`}
      >
        Fit Width
      </button>
      <button
        onClick={() => setImageZoom(3)}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${
          imageZoom === 3
            ? "bg-white/30 text-white"
            : "bg-black/30 text-white/70 hover:text-white hover:bg-black/50"
        }`}
      >
        Fit Height
      </button>
    </motion.div>
  );

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
    <div className="min-h-screen font-sans">
      {/* Hero Section */}
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
          onClick={scrollToGrid}
          className="absolute bottom-10 z-20 text-white/80 hover:text-white transition-colors"
          style={{
            opacity: isHeroLoaded ? 1 : 0,
            transition: "opacity 1s ease 0.5s",
          }}
        >
          <ChevronDown size={48} className="animate-bounce" />
        </button>
      </header>

      {/* Gallery Grid */}
      {isHeroLoaded && galleryImages.length > 0 && (
        <main
          id="gallery-grid"
          ref={galleryGridRef}
          tabIndex={-1}
          className="w-full px-2 py-2 min-h-screen"
        >
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-2" />
          <SimpleMasonry>
            {galleryImages.map((image, index) => (
              <GalleryImage
                key={`${image.thumbnail}-${index}`}
                image={image}
                index={index}
                onClick={handleImageClick}
                isSelected={
                  (!selectedImage &&
                    lastViewedImage &&
                    lastViewedImage.thumbnail === image.thumbnail) ||
                  false
                }
                imageRef={index === galleryImages.length - 1 ? lastImageRef : undefined}
              />
            ))}
          </SimpleMasonry>
          {/* Loading indicator for additional pages */}
          {isLoading && currentPage > 1 && (
            <div className="text-center my-8">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-white/60">Loading more images...</p>
            </div>
          )}
          {/* Pagination controls */}
          <div className="text-center mt-8 mb-16 text-white/60">
            <p>
              Showing {(currentPage - 1) * 50 + galleryImages.length} of {totalImages} images
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading || isPaging}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <span className="self-center">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages || isLoading || isPaging}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && handleModalClose()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ModalImage
              image={selectedImage}
              imageZoom={imageZoom}
              onDoubleClick={handleZoomCycle}
              imageDimensions={selectedImageDimensions}
              showPanHint={showPanHint}
              onDismissPanHint={() => setShowPanHint(false)}
            />
            <button
              onClick={handleModalClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X size={24} />
            </button>
            <ZoomControls />
            <motion.div
              className="absolute top-4 left-4 z-20 px-3 py-2 rounded-lg bg-black/50 text-white text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {getZoomLabel(imageZoom)}
              {selectedImageDimensions && (
                <div className="text-xs text-white/60 mt-1">
                  {selectedImageDimensions.width} × {selectedImageDimensions.height}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
