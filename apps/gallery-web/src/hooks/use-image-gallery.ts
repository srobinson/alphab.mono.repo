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
  currentPage: number;
  totalPages: number;
  totalImages: number;
  isLoading: boolean;
  error: string | null;
  galleryData: GalleryData | null;
  nextImage: () => Image | null;
  previousImage: () => Image | null;
  goToImage: (index: number) => Image | null;
  getRandomImage: () => Image | null;
  reshuffleGallery: () => void;
  getCurrentImage: () => Image | null;
  setCurrentImage: (image: Image) => void;
  findImageIndex: (image: Image) => number;
  getImageDimensions: (image: Image) => { width: number; height: number } | null;
  resetToFirst: () => Image | null;
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextPage: () => void;
  previousPage: () => void;
}

const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function useImageGallery(): UseImageGalleryReturn {
  const [galleryData, setGalleryData] = useState<GalleryData | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaging, setIsPaging] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<
    Map<string, { width: number; height: number }>
  >(new Map());
  const pageSize = 50;
  const [loadedImages, setLoadedImages] = useState<Image[]>([]);

  const images = useMemo<Image[]>(() => {
    if (!galleryData?.images?.length) return [];
    return galleryData.images.map((imageData: GalleryImage) => ({
      full: `${FULL_IMAGE_BASE}/${imageData.variants.original.filename}`,
      thumbnail: `${THUMBNAIL_BASE}/${imageData.variants["320"].filename}`,
    }));
  }, [galleryData]);

  // Update loaded images when page changes
  useEffect(() => {
    if (!galleryData?.images?.length) return;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const newImages = galleryData.images.slice(start, end).map((imageData: GalleryImage) => ({
      full: `${FULL_IMAGE_BASE}/${imageData.variants.original.filename}`,
      thumbnail: `${THUMBNAIL_BASE}/${imageData.variants["320"].filename}`,
    }));

    if (currentPage === 1) {
      setLoadedImages(newImages);
    } else {
      console.log("newImages", newImages);
      console.log("loadedImages", loadedImages);
      console.log("currentPage", currentPage);
      console.log("totalPages", totalPages);
      console.log("isLoading", isLoading);
      console.log("isPaging", isPaging);
      console.log("pageSize", pageSize);
      setLoadedImages((prev) => [...prev, ...newImages]);
    }
    setIsPaging(false);

    // Reset isPaging after images are loaded
    return () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("imagesLoaded"));
      }
    };
  }, [galleryData, currentPage]);

  const totalPages = useMemo(
    () => (galleryData ? Math.ceil(galleryData.images.length / pageSize) : 0),
    [galleryData],
  );

  const currentImage = useMemo<Image | null>(() => {
    return loadedImages.length > 0 && currentIndex >= 0 && currentIndex < loadedImages.length
      ? loadedImages[currentIndex]
      : null;
  }, [loadedImages, currentIndex]);

  const canGoNext = useMemo(
    () => currentIndex < loadedImages.length - 1 || currentPage < totalPages,
    [loadedImages.length, currentIndex, currentPage, totalPages],
  );
  const canGoPrevious = useMemo(
    () => currentIndex > 0 || currentPage > 1,
    [currentIndex, currentPage],
  );

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
        const randomizedImages = shuffleArray(data.images);
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
    if (loadedImages.length === 0) return null;
    if (currentIndex + 1 >= loadedImages.length && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setCurrentIndex(0);
      return loadedImages[0];
    }
    const nextIndex = (currentIndex + 1) % loadedImages.length;
    setCurrentIndex(nextIndex);
    return loadedImages[nextIndex];
  }, [loadedImages, currentIndex, currentPage, totalPages]);

  const previousImage = useCallback((): Image | null => {
    if (loadedImages.length === 0) return null;
    if (currentIndex === 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setCurrentIndex(pageSize - 1);
      return loadedImages[pageSize - 1];
    }
    const prevIndex = currentIndex === 0 ? loadedImages.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    return loadedImages[prevIndex];
  }, [loadedImages, currentIndex, currentPage]);

  const getRandomImage = useCallback((): Image | null => {
    if (images.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * images.length);
    const targetPage = Math.floor(randomIndex / pageSize) + 1;
    const pageIndex = randomIndex % pageSize;
    setCurrentPage(targetPage);
    setCurrentIndex(pageIndex);
    return images[randomIndex];
  }, [images, pageSize]);

  const resetToFirst = useCallback((): Image | null => {
    if (images.length === 0) return null;
    setCurrentPage(1);
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
        const targetPage = Math.floor(index / pageSize) + 1;
        const pageIndex = index % pageSize;
        setCurrentPage(targetPage);
        setCurrentIndex(pageIndex);
      }
    },
    [images, pageSize],
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
      setCurrentPage(1);
      setCurrentIndex(0);
    }
  };

  const nextPage = useCallback(() => {
    if (!isPaging && currentPage < totalPages) {
      setIsPaging(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [isPaging, currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setCurrentIndex(0);
    }
  }, [currentPage]);

  // Navigate to next/previous image with pagination
  const navigateImage = (direction: number) => {
    const nextIndex = currentIndex + direction;

    // If we're at the end of the current page and trying to go forward
    if (direction > 0 && nextIndex >= loadedImages.length) {
      // If there are more pages, load the next page
      if (currentPage < totalPages && !isLoading && !isPaging) {
        setIsPaging(true);
        nextPage();
        return null; // Return null to indicate we're loading a new page
      }
      return null; // No more pages
    }

    // If we're at the start of the current page and trying to go backward
    if (direction < 0 && nextIndex < 0) {
      // If we're not on the first page, go to previous page
      if (currentPage > 1 && !isLoading && !isPaging) {
        setIsPaging(true);
        previousPage();
        return null; // Return null to indicate we're loading a new page
      }
      return null; // On first page
    }

    // If we're within the current page's bounds, update the image
    if (nextIndex >= 0 && nextIndex < loadedImages.length) {
      const nextImg = loadedImages[nextIndex];
      if (nextImg) {
        setCurrentIndex(nextIndex);
        return nextImg;
      }
    }

    return null;
  };

  // Update current image when new page loads
  useEffect(() => {
    if (isPaging && loadedImages.length > 0) {
      const currentImage = loadedImages[currentIndex];
      if (!currentImage) {
        // If current image is not in the new page, select the first image
        setCurrentIndex(0);
      }
    }
  }, [loadedImages, currentIndex, isPaging]);

  // Go to a specific image index
  const goToImage = (index: number): Image | null => {
    if (index >= 0 && index < loadedImages.length) {
      setCurrentIndex(index);
      return loadedImages[index];
    }
    return null;
  };

  return {
    images: loadedImages,
    currentImage,
    currentIndex,
    currentPage,
    totalPages,
    totalImages: galleryData?.totalImages || 0,
    isLoading,
    error,
    galleryData,
    nextImage: () => navigateImage(1),
    previousImage: () => navigateImage(-1),
    goToImage,
    getRandomImage,
    reshuffleGallery,
    getCurrentImage,
    setCurrentImage,
    findImageIndex,
    getImageDimensions,
    resetToFirst,
    canGoNext,
    canGoPrevious,
    nextPage,
    previousPage,
  };
}
