import { AnimatePresence } from "framer-motion";
import { GalleryProvider } from "../../contexts/GalleryContext";
import { GalleryGrid } from "../GalleryGrid";
import Hero from "../Hero";
import { ImageCounter } from "../ImageCounter";
import ImageModal from "../ImageModal";
import type { GalleryProps } from "./useGallery";

export function Gallery({
  hero, // ✅ Hero props grouped
  grid, // ✅ Gallery grid props grouped
  modal, // ✅ Modal props grouped
  provider, // ✅ Provider props grouped
}: GalleryProps) {
  return (
    <GalleryProvider
      currentIndex={provider.currentIndex}
      onIndexChange={() => {}}
      totalImages={provider.totalImages}
    >
      <Hero
        heroImage={hero.heroImage}
        isModalOpen={hero.isModalOpen}
        onImageChange={() => {}}
        onImageClick={hero.onHeroImageClick}
        onScrollToGrid={hero.onScrollToGrid}
        setCurrentImage={() => {}} // ❌ COULD REMOVE - Not needed, using empty function
        totalImages={hero.totalImages}
      />

      <GalleryGrid
        images={{ images: grid.galleryImages }}
        pagination={{
          currentPage: grid.currentPage,
          isLoading: grid.isLoading,
          onNextPage: grid.onNextPage,
          onPreviousPage: grid.onPreviousPage,
          totalImages: grid.totalImages,
          totalPages: grid.totalPages,
        }}
        selection={{
          lastViewedImage: grid.lastViewedImage,
          onImageClick: grid.onImageClick,
        }}
      />

      <AnimatePresence mode="wait">
        {modal.hasValidModal && (
          <div key="image-modal">
            <ImageModal
              core={{
                image: modal.currentImage || { full: "", thumbnail: "" },
                imageDimensions: modal.currentImage
                  ? modal.getImageDimensions(modal.currentImage)
                  : undefined,
                isPaging: modal.isPaging,
                onClose: modal.onCloseModal,
                onNextImage: modal.onNextImage,
                onPreviousImage: modal.onPreviousImage,
              }}
            />
            <ImageCounter
              currentIndex={modal.currentIndex + 1}
              isLoading={modal.isPaging}
              totalImages={modal.totalImages}
            />
          </div>
        )}
      </AnimatePresence>
    </GalleryProvider>
  );
}
