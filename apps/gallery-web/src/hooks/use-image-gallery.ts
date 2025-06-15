import { useState, useEffect, useCallback, useMemo } from "react";

const GITHUB_BASE_URL = "https://i.awake-careful-ant.com";
const GALLERY_JSON_URL = `${GITHUB_BASE_URL}/gallery.json`;
const FULL_IMAGE_BASE = `${GITHUB_BASE_URL}/optimized`;
const THUMBNAIL_BASE = `${GITHUB_BASE_URL}/optimized/320`;

interface GalleryImage {
  filename: string;
  index: number;
  variants: {
    "320": {
      width: number;
      height: number;
      filename: string;
    };
    original: {
      width: number;
      height: number;
      filename: string;
    };
  };
}

interface GalleryData {
  totalImages: number;
  images: GalleryImage[];
}

interface Image {
  full: string;
  thumbnail: string;
}

interface UseImageGalleryReturn {
  images: Image[];
  currentImage: Image | null;
  currentIndex: number;
  totalImages: number;
  isLoading: boolean;
  error: string | null;
  galleryData: GalleryData | null; // Expose galleryData for dimensions

  // Navigation methods
  nextImage: () => Image | null;
  previousImage: () => Image | null;
  goToImage: (index: number) => Image | null;
  getRandomImage: () => Image | null;
  reshuffleGallery: () => void;

  // Utility methods
  getCurrentImage: () => Image | null;
  setCurrentImage: (image: Image) => void;
  findImageIndex: (image: Image) => number;
  getImageDimensions: (image: Image) => { width: number; height: number } | null;

  // Additional utility methods
  resetToFirst: () => Image | null;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

// Fisher-Yates shuffle algorithm for true randomization
const shuffleArray = (array: any[]) => {
  const shuffled = [...array]; // Create a copy to avoid mutating original

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

export function useImageGallery(): UseImageGalleryReturn {
  const [galleryData, setGalleryData] = useState<GalleryData | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fixed images mapping
  const images = useMemo<Image[]>(() => {
    if (!galleryData?.images?.length) return [];

    return galleryData.images.map((imageData: GalleryImage) => ({
      full: `${FULL_IMAGE_BASE}/${imageData.variants.original.filename}`,
      thumbnail: `${THUMBNAIL_BASE}/${imageData.variants["320"].filename}`,
    }));
  }, [galleryData]);

  const currentImage = useMemo<Image | null>(() => {
    return images.length > 0 && currentIndex >= 0 && currentIndex < images.length
      ? images[currentIndex]
      : null;
  }, [images, currentIndex]);

  const canGoNext = useMemo(() => images.length > 1, [images.length]);
  const canGoPrevious = useMemo(() => images.length > 1, [images.length]);

  // Fixed fetch
  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(GALLERY_JSON_URL);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();

        if (!data.images || !Array.isArray(data.images)) {
          throw new Error("Invalid gallery data format");
        }

        // Use the improved shuffle instead of biased sort
        const randomizedImages = shuffleArray(data.images);

        // Or use crypto-based shuffle for even better randomness:
        // const randomizedImages = cryptoShuffleArray(data.images);

        setGalleryData({
          ...data,
          images: randomizedImages,
        });
        setCurrentIndex(0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error fetching gallery:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryData();
  }, []);

  const nextImage = useCallback((): Image | null => {
    if (images.length === 0) return null;
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    return images[nextIndex];
  }, [images, currentIndex]);

  const previousImage = useCallback((): Image | null => {
    if (images.length === 0) return null;
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    return images[prevIndex];
  }, [images, currentIndex]);

  const goToImage = useCallback(
    (index: number): Image | null => {
      if (images.length === 0 || index < 0 || index >= images.length) return null;
      setCurrentIndex(index);
      return images[index];
    },
    [images],
  );

  const getRandomImage = useCallback((): Image | null => {
    if (images.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * images.length);
    setCurrentIndex(randomIndex);
    return images[randomIndex];
  }, [images]);

  const resetToFirst = useCallback((): Image | null => {
    if (images.length === 0) return null;
    setCurrentIndex(0);
    return images[0];
  }, [images]);

  const getCurrentImage = useCallback((): Image | null => {
    return currentImage;
  }, [currentImage]);

  const setCurrentImage = useCallback(
    (image: Image): void => {
      const index = images.findIndex(
        (img) => img.full === image.full && img.thumbnail === image.thumbnail,
      );
      if (index !== -1) {
        setCurrentIndex(index);
      }
    },
    [images],
  );

  const findImageIndex = useCallback(
    (image: Image): number => {
      return images.findIndex(
        (img) => img.full === image.full && img.thumbnail === image.thumbnail,
      );
    },
    [images],
  );

  const getImageDimensions = useCallback(
    (image: Image): { width: number; height: number } | null => {
      if (!galleryData?.images) return null;

      const imageData = galleryData.images.find((img) =>
        image.full.includes(img.variants.original.filename),
      );

      return imageData ? imageData.variants.original : null;
    },
    [galleryData],
  );

  const reshuffleGallery = () => {
    if (galleryData?.images) {
      const reshuffled = shuffleArray(galleryData.images);
      setGalleryData({
        ...galleryData,
        images: reshuffled,
      });
      setCurrentIndex(0);
    }
  };

  return {
    images,
    currentImage,
    currentIndex,
    totalImages: images.length,
    isLoading,
    error,
    galleryData, // Expose galleryData
    nextImage,
    previousImage,
    goToImage,
    getRandomImage,
    getCurrentImage,
    setCurrentImage,
    findImageIndex,
    getImageDimensions, // New utility method
    resetToFirst,
    canGoNext,
    canGoPrevious,
    reshuffleGallery,
  };
}
