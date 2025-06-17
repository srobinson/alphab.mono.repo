import { useMemo } from "react";
import { useGallery } from "./useGallery";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useModalState } from "./useModalState";

export function useAppState() {
  const galleryData = useGallery();
  const {
    currentIndex,
    currentPage,
    error,
    getImageDimensions,
    images,
    isLoading,
    isPaging,
    nextImage,
    nextPage,
    previousImage,
    previousPage,
    setCurrentIndex,
    totalImages,
    totalPages,
  } = galleryData;

  // ✅ EXTRACTED - Modal state management
  const modalState = useModalState({ images, setCurrentIndex });

  // ✅ EXTRACTED - Infinite scroll behavior
  useInfiniteScroll({ onLoadMore: nextPage });

  // ✅ COMPUTED - Derived values
  const heroImage = useMemo(() => {
    return images.length > 0 ? images[0] : null;
  }, [images]);

  const currentImage = images[currentIndex];
  const hasValidModal = modalState.isModalOpen && currentImage;

  // ✅ UTILITIES - Navigation and scroll helpers
  const scrollToGallery = () => {
    document.getElementById("gallery-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ LOADING STATES - Derived loading conditions
  const isInitialLoading = isLoading && currentPage === 1;
  const isEmpty = !images.length && !isLoading;

  // ✅ GROUPED RETURN - Organized by responsibility
  return {
    // Gallery core data and state
    gallery: {
      images,
      currentIndex,
      totalImages,
      totalPages,
      currentPage,
      isPaging,
      isLoading,
      error,
    },

    // Computed/derived values
    computed: {
      heroImage,
      currentImage,
      hasValidModal,
      isInitialLoading,
      isEmpty,
    },

    // Modal state and handlers
    modal: {
      isOpen: modalState.isModalOpen,
      open: modalState.openModal,
      close: modalState.closeModal,
      handleImageClick: modalState.handleImageClick,
    },

    // Navigation actions
    navigation: {
      nextImage,
      previousImage,
      nextPage,
      previousPage,
      scrollToGallery,
    },

    // Utilities
    utils: {
      getImageDimensions,
    },
  };
}
