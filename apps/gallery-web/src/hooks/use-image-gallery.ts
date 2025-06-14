import { useState, useEffect, useCallback, useMemo } from "react";

interface GalleryData {
  gallery: string;
  images: string[];
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

  // Navigation methods
  nextImage: () => Image | null;
  previousImage: () => Image | null;
  goToImage: (index: number) => Image | null;
  getRandomImage: () => Image | null;

  // Utility methods
  getCurrentImage: () => Image | null;
  setCurrentImage: (image: Image) => void;
  findImageIndex: (image: Image) => number;
}

const GITHUB_BASE_URL = "https://i.awake-careful-ant.com/optimized/";
const GITHUB_THUMB_BASE_URL = `${GITHUB_BASE_URL}320/`;

export function useImageGallery(): UseImageGalleryReturn {
  const [fullImages, setFullImages] = useState<string[]>([]);
  const [thumbnailImages, setThumbnailImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized combined images array with improved matching logic
  const images = useMemo<Image[]>(() => {
    if (fullImages.length === 0 || thumbnailImages.length === 0) return [];

    // Create combined images using the same logic as your original code
    const combinedImages: Image[] = fullImages.map((fullName: string) => {
      // Find a thumbnail that has a similar name
      const thumbName = thumbnailImages.find((tName: string) =>
        fullName.includes(tName.replace(".jpg", "")),
      );

      return {
        full: `${GITHUB_BASE_URL}${fullName}`,
        thumbnail: `${GITHUB_THUMB_BASE_URL}${thumbName || fullName}`,
      };
    });

    return combinedImages;
  }, [fullImages, thumbnailImages]);

  const currentImage = useMemo<Image | null>(() => {
    return images.length > 0 ? images[currentIndex] || null : null;
  }, [images, currentIndex]);

  // Fetch and randomize images on mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both JSON files
        const [fullResponse, thumbnailResponse] = await Promise.all([
          fetch("/gallery-images-full.json"),
          fetch("/gallery-images-320.json"),
        ]);

        if (!fullResponse.ok || !thumbnailResponse.ok) {
          throw new Error("Failed to fetch image data");
        }

        const fullData: GalleryData = await fullResponse.json();
        const thumbnailData: GalleryData = await thumbnailResponse.json();

        // Randomize the full images array (this will be our master order)
        const randomizedFullImages = [...fullData.images].sort(() => Math.random() - 0.5);

        setFullImages(randomizedFullImages);
        setThumbnailImages(thumbnailData.images);
        setCurrentIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching images:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Navigation methods
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

  return {
    images,
    currentImage,
    currentIndex,
    totalImages: images.length,
    isLoading,
    error,

    // Navigation methods
    nextImage,
    previousImage,
    goToImage,
    getRandomImage,

    // Utility methods
    getCurrentImage,
    setCurrentImage,
    findImageIndex,
  };
}
