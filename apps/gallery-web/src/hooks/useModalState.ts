import { useState } from "react";
import type { Image } from "./useGallery";

interface UseModalStateProps {
  images: Image[];
  setCurrentIndex: (index: number) => void;
}

export function useModalState({ images, setCurrentIndex }: UseModalStateProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = (imageIndex?: number) => {
    if (imageIndex !== undefined) {
      setCurrentIndex(imageIndex);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleImageClick = (image: Image) => {
    const idx = images.findIndex(
      (img) => img.full === image.full && img.thumbnail === image.thumbnail,
    );
    if (idx !== -1) {
      openModal(idx);
    }
  };

  return {
    isModalOpen,
    openModal,
    closeModal,
    handleImageClick,
  };
}
