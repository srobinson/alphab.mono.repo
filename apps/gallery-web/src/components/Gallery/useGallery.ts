import { useAppState } from "../../hooks/useAppState";
import type { Image } from "../../hooks/useGallery";

export interface GalleryContainerProps {
  appState: ReturnType<typeof useAppState>;
}

// Grouped prop interfaces following ImageModal pattern
export interface GalleryHeroProps {
  heroImage: ReturnType<typeof useAppState>["computed"]["heroImage"];
  isModalOpen: boolean;
  onHeroImageClick: () => void;
  onScrollToGrid: () => void;
  totalImages: number;
}

export interface GalleryGridProps {
  galleryImages: Image[];
  currentPage: number;
  totalPages: number;
  totalImages: number;
  isLoading: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  lastViewedImage: ReturnType<typeof useAppState>["computed"]["currentImage"];
  onImageClick: (image: Image) => void;
}

export interface GalleryModalProps {
  hasValidModal: boolean;
  currentImage: ReturnType<typeof useAppState>["computed"]["currentImage"];
  getImageDimensions: (image: Image) => { width: number; height: number } | null;
  isPaging: boolean;
  onCloseModal: () => void;
  onNextImage: () => void;
  onPreviousImage: () => void;
  currentIndex: number;
  totalImages: number;
}

export interface GalleryProviderProps {
  currentIndex: number;
  totalImages: number;
}

// Main Gallery component props (grouped objects like ImageModal)
export interface GalleryProps {
  hero: GalleryHeroProps;
  grid: GalleryGridProps;
  modal: GalleryModalProps;
  provider: GalleryProviderProps;
}

export function useGallery({ appState }: GalleryContainerProps): GalleryProps {
  // Filter hero image from gallery images
  const galleryImages = appState.gallery.images.filter(
    (img: Image) =>
      !appState.computed.heroImage || img.thumbnail !== appState.computed.heroImage.thumbnail,
  );

  return {
    hero: {
      heroImage: appState.computed.heroImage,
      isModalOpen: appState.modal.isOpen,
      onHeroImageClick: () => appState.modal.open(0),
      onScrollToGrid: appState.navigation.scrollToGallery,
      totalImages: appState.gallery.totalImages,
    },
    grid: {
      galleryImages,
      currentPage: appState.gallery.currentPage,
      totalPages: appState.gallery.totalPages,
      totalImages: appState.gallery.totalImages,
      isLoading: appState.gallery.isLoading,
      onNextPage: appState.navigation.nextPage,
      onPreviousPage: appState.navigation.previousPage,
      lastViewedImage: appState.computed.currentImage,
      onImageClick: appState.modal.handleImageClick,
    },
    modal: {
      hasValidModal: Boolean(appState.computed.hasValidModal),
      currentImage: appState.computed.currentImage,
      getImageDimensions: appState.utils.getImageDimensions,
      isPaging: appState.gallery.isPaging,
      onCloseModal: appState.modal.close,
      onNextImage: appState.navigation.nextImage,
      onPreviousImage: appState.navigation.previousImage,
      currentIndex: appState.gallery.currentIndex,
      totalImages: appState.gallery.totalImages,
    },
    provider: {
      currentIndex: appState.gallery.currentIndex,
      totalImages: appState.gallery.totalImages,
    },
  };
}
