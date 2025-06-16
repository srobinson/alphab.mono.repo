import { useState, useEffect, useMemo, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useImageGallery } from "./hooks/use-image-gallery";
import { Hero } from "./components/Hero";
import { GalleryGrid } from "./components/GalleryGrid";
import ImageModal from "./components/ImageModal/index";
import { ImageCounter } from "./components/ImageCounter";
import "./gallery.css";

interface Image {
  full: string;
  thumbnail: string;
}

function App() {
  const {
    images,
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
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const galleryGridRef = useRef<HTMLDivElement>(null);
  const lastImageRef = useRef<HTMLDivElement>(null);

  // Select first image as hero image
  const heroImage = useMemo(() => {
    return images.length > 0 ? images[0] : null;
  }, [images]);

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

  // Find index of selectedImage in images
  const selectedIndex = selectedImage
    ? images.findIndex((img) => img.thumbnail === selectedImage.thumbnail)
    : -1;

  // Modal navigation
  const handleNextImage = () => {
    if (selectedIndex === -1) return;
    if (selectedIndex + 1 < images.length) {
      setSelectedImage(images[selectedIndex + 1]);
    } else if (images.length < totalImages) {
      setPendingAdvance(true);
      nextPage();
    }
  };
  const handlePreviousImage = () => {
    if (selectedIndex > 0) {
      setSelectedImage(images[selectedIndex - 1]);
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
  }, [isModalOpen, selectedIndex, images.length, totalImages]);

  // When new images are loaded and user was at end, auto-advance
  useEffect(() => {
    if (
      pendingAdvance &&
      selectedIndex === images.length - 2 &&
      images.length > selectedIndex + 1
    ) {
      setSelectedImage(images[selectedIndex + 1]);
      setPendingAdvance(false);
    }
  }, [images.length, pendingAdvance, selectedIndex]);

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
    if (nextIndex < 0 || nextIndex >= images.length) return;

    const nextImg = images[nextIndex];
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
        if (images.length > 0) {
          setSelectedImage(images[0]);
          setCurrentImage(images[0]);
        }
      }
    }
  }, [images, selectedImage, isPaging]);

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
  if (!images.length) {
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
        images={images}
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
              isLoading={isPaging}
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
