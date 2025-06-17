import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

// import { DesignPreview } from "./components/DesignExperiment";
import { GalleryGrid } from "./components/GalleryGrid";
import Hero from "./components/Hero";
import { ImageCounter } from "./components/ImageCounter";
import { ImageModal } from "./components/ImageModal";
import { useGallery } from "./hooks/useGallery";
import { useImageModal } from "./hooks/useImageModal";

import "./gallery.css";

function App() {
  const {
    images,
    currentIndex,
    setCurrentIndex,
    isLoading,
    error,
    totalImages,
    totalPages,
    currentPage,
    canGoNext, // <-- do we need these
    canGoPrevious, // <-- do we need these
    nextImage,
    previousImage,
    goToImage, // <-- do we need these
    getImageDimensions,
    nextPage,
    previousPage,
    isPaging,
  } = useGallery();

  const [isModalOpen, setModalOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const galleryGridRef = useRef<HTMLDivElement>(null); // <-- do we need these
  const lastImageRef = useRef<HTMLDivElement>(null); // <-- do we need these

  // Infinite scroll: load next page when at bottom
  useEffect(() => {
    const onscroll = () => {
      const scrolledTo = window.scrollY + window.innerHeight + 300;
      const scrollHeight = document.body.scrollHeight;
      const isAtBottom = scrolledTo > scrollHeight;

      if (isAtBottom) {
        nextPage();
      }
    };
    window.addEventListener("scroll", onscroll);
    return () => {
      window.removeEventListener("scroll", onscroll);
    };
  }, [nextPage]);

  // Select first image as hero image
  const heroImage = useMemo(() => {
    return images.length > 0 ? images[0] : null;
  }, [images]);

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
            setCurrentIndex(0);
            setModalOpen(true);
          }
        }
      }
    };
    const heroElement = heroRef.current;
    heroElement?.addEventListener("keydown", handleHeroKeyDown);
    return () => heroElement?.removeEventListener("keydown", handleHeroKeyDown);
  }, [heroImage, setCurrentIndex]);

  // Handle hero image navigation
  const handleHeroImageChange = (direction: "prev" | "next") => {
    if (!heroImage) return;
    if (currentIndex === -1) return;
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    setCurrentIndex(nextIndex);
  };

  // Scroll to gallery grid
  const scrollToGallery = () => {
    document.getElementById("gallery-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  // Always call useImageModal, even if modal is not open
  const hasModalImage = isModalOpen && images[currentIndex];
  const imageModal = useImageModal(
    hasModalImage
      ? {
          image: images[currentIndex],
          imageDimensions: getImageDimensions(images[currentIndex]),
          isPaging,
          onClose: () => setModalOpen(false),
          onNextImage: nextImage,
          onPreviousImage: previousImage,
        }
      : {
          image: { full: "", thumbnail: "" },
          imageDimensions: undefined,
          isPaging: false,
          onClose: () => {},
        },
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
    <>
      <Hero
        heroImage={heroImage}
        isModalOpen={isModalOpen}
        onImageChange={handleHeroImageChange}
        onImageClick={() => {
          setCurrentIndex(0);
          setModalOpen(true);
        }}
        onScrollToGrid={scrollToGallery}
        setCurrentImage={(image) => {
          const idx = images.findIndex(
            (img) => img.full === image.full && img.thumbnail === image.thumbnail,
          );
          if (idx !== -1) setCurrentIndex(idx);
        }}
        totalImages={totalImages}
      />
      {/* <DesignPreview /> */}
      <GalleryGrid
        images={{ images, heroImage }}
        pagination={{
          currentPage,
          totalPages,
          totalImages,
          isPaging,
          isLoading,
          onNextPage: nextPage,
          onPreviousPage: previousPage,
        }}
        selection={{
          lastViewedImage: images[currentIndex],
          onImageClick: (image: (typeof images)[0]) => {
            const idx = images.findIndex(
              (img) => img.full === image.full && img.thumbnail === image.thumbnail,
            );
            if (idx !== -1) {
              setCurrentIndex(idx);
              setModalOpen(true);
            }
          },
        }}
      />
      <AnimatePresence>
        {isModalOpen && images[currentIndex] && (
          <>
            <ImageModal
              image={images[currentIndex]}
              imageDimensions={getImageDimensions(images[currentIndex])}
              isPaging={isPaging}
              onClose={() => setModalOpen(false)}
              onNextImage={nextImage}
              onPreviousImage={previousImage}
              {...imageModal}
            />
            <ImageCounter
              currentIndex={currentIndex + 1}
              isLoading={isPaging}
              totalImages={totalImages}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
