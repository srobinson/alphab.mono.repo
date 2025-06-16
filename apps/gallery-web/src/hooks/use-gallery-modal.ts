import { useState, useMemo, useEffect, useCallback } from "react";
import type { Image } from "./use-image-gallery";

interface UseGalleryModalArgs {
  images: Image[];
  totalImages: number;
  setCurrentImage: (image: Image) => void;
  findImageIndex: (image: Image) => number;
  getImageDimensions: (image: Image) => { width: number; height: number } | null;
  nextPage: () => void;
  isPaging: boolean;
  currentPage: number;
  totalPages: number;
}

export function useGalleryModal({
  images,
  totalImages,
  setCurrentImage,
  findImageIndex,
  getImageDimensions,
  nextPage,
  isPaging,
  currentPage,
  totalPages,
}: UseGalleryModalArgs) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [lastViewedImage, setLastViewedImage] = useState<Image | null>(null);
  const [imageZoom, setImageZoom] = useState(2);
  const [showPanHint, setShowPanHint] = useState(true);
  const [pendingAdvance, setPendingAdvance] = useState(false);

  // Modal open if selectedImage is not null
  const isModalOpen = !!selectedImage;

  // Find index of selectedImage in images
  const selectedIndex = selectedImage
    ? images.findIndex((img) => img.thumbnail === selectedImage.thumbnail)
    : -1;

  // Get dimensions for selected image
  const selectedImageDimensions = useMemo(() => {
    if (!selectedImage) return null;
    return getImageDimensions(selectedImage);
  }, [selectedImage, getImageDimensions]);

  // Modal navigation
  const handleNextImage = useCallback(() => {
    if (selectedIndex === -1) return;
    if (selectedIndex + 1 < images.length) {
      setSelectedImage(images[selectedIndex + 1]);
    } else if (images.length < totalImages) {
      setPendingAdvance(true);
      nextPage();
    }
  }, [selectedIndex, images, totalImages, nextPage]);

  const handlePreviousImage = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedImage(images[selectedIndex - 1]);
    }
  }, [selectedIndex, images]);

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
  }, [isModalOpen, handleNextImage, handlePreviousImage]);

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
  const handleImageClick = useCallback((image: Image) => {
    setSelectedImage(image);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    if (selectedImage) setLastViewedImage(selectedImage);
    setSelectedImage(null);
  }, [selectedImage]);

  // Cycle through zoom levels
  const handleZoomCycle = useCallback(() => {
    setImageZoom((prev) => {
      const nextZoom = prev === 1 ? 2 : prev === 2 ? 3 : 1;
      return nextZoom;
    });
  }, []);

  // Get zoom level label
  const getZoomLabel = useCallback(() => {
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
  }, [imageZoom]);

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
  }, [images, selectedImage, isPaging, findImageIndex, setCurrentImage]);

  return {
    selectedImage,
    setSelectedImage,
    lastViewedImage,
    setLastViewedImage,
    imageZoom,
    setImageZoom,
    showPanHint,
    setShowPanHint,
    isModalOpen,
    selectedIndex,
    selectedImageDimensions,
    handleNextImage,
    handlePreviousImage,
    handleImageClick,
    handleModalClose,
    handleZoomCycle,
    getZoomLabel,
  };
}
