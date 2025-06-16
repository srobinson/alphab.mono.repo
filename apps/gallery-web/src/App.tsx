import { useState, useEffect, useMemo, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useImageGallery, type Image } from "./hooks/use-image-gallery";
import { useGalleryModal } from "./hooks/use-gallery-modal";
import { useInfiniteGalleryPaging } from "./hooks/use-infinite-gallery-paging";
import Hero from "./components/Hero";
import { GalleryGrid } from "./components/GalleryGrid";
import ImageModal from "./components/ImageModal/index";
import { ImageCounter } from "./components/ImageCounter";
import "./gallery.css";
import debounce from "./utils/debounce";

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

  // Paging logic
  const paging = useInfiniteGalleryPaging({
    currentPage,
    totalPages,
    isLoading,
    nextPage,
    previousPage,
  });

  // Modal state/logic
  const modal = useGalleryModal({
    images,
    totalImages,
    setCurrentImage,
    findImageIndex,
    getImageDimensions,
    nextPage,
    isPaging: paging.isPaging,
    currentPage,
    totalPages,
  });

  const heroRef = useRef<HTMLDivElement>(null);
  const galleryGridRef = useRef<HTMLDivElement>(null);
  const lastImageRef = useRef<HTMLDivElement>(null);

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
            modal.setSelectedImage(heroImage);
            setCurrentImage(heroImage);
            modal.setImageZoom(2); // Set initial zoom level
          }
        }
      }
    };
    const heroElement = heroRef.current;
    heroElement?.addEventListener("keydown", handleHeroKeyDown);
    return () => heroElement?.removeEventListener("keydown", handleHeroKeyDown);
  }, [heroImage, modal, setCurrentImage]);

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
        onImageClick={modal.handleImageClick}
        onImageChange={handleHeroImageChange}
        onScrollToGrid={scrollToGallery}
        setCurrentImage={setCurrentImage}
        isModalOpen={modal.isModalOpen}
      />
      <GalleryGrid
        images={images}
        heroImage={heroImage}
        onImageClick={modal.handleImageClick}
        onNextPage={paging.handleNextPage}
        onPreviousPage={paging.handlePreviousPage}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalImages={totalImages}
        isPaging={paging.isPaging}
        lastViewedImage={modal.lastViewedImage}
      />
      <AnimatePresence>
        {modal.isModalOpen && modal.selectedImage && (
          <>
            <ImageModal
              image={modal.selectedImage}
              onClose={modal.handleModalClose}
              imageZoom={modal.imageZoom}
              onDoubleClick={modal.handleZoomCycle}
              imageDimensions={modal.selectedImageDimensions}
              showPanHint={modal.showPanHint}
              onDismissPanHint={() => modal.setShowPanHint(false)}
              zoomLabel={modal.getZoomLabel()}
              onZoomChange={modal.setImageZoom}
              onNextImage={modal.handleNextImage}
              onPreviousImage={modal.handlePreviousImage}
              isLoading={paging.isPaging}
            />
            <ImageCounter
              currentIndex={modal.selectedIndex + 1}
              totalImages={totalImages}
              isLoading={paging.isPaging}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
