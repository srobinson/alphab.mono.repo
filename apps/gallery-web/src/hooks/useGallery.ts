import { useState, useEffect, useCallback, useMemo } from "react";

const GITHUB_BASE_URL = "https://i.awake-careful-ant.com";
const GALLERY_JSON_URL = `${GITHUB_BASE_URL}/gallery.json`;
const FULL_IMAGE_BASE = `${GITHUB_BASE_URL}/optimized`;
const THUMBNAIL_BASE = `${GITHUB_BASE_URL}/optimized/320`;

export type Image = {
  full: string;
  thumbnail: string;
};

interface GalleryImage {
  filename: string;
  index: number;
  variants: {
    "320": { width: number; height: number; filename: string };
    original: { width: number; height: number; filename: string };
  };
}

interface GalleryData {
  totalImages: number;
  images: GalleryImage[];
}

const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function useGallery() {
  const [galleryData, setGalleryData] = useState<GalleryData | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaging, setIsPaging] = useState(false);
  const pageSize = 50;
  const [loadedImages, setLoadedImages] = useState<Image[]>([]);

  // All images (flattened)
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
      setLoadedImages((prev) => [...prev, ...newImages]);
    }
    setIsPaging(false);
  }, [galleryData, currentPage]);

  const totalPages = useMemo(
    () => (galleryData ? Math.ceil(galleryData.images.length / pageSize) : 0),
    [galleryData],
  );

  // Fetch gallery data on mount
  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(GALLERY_JSON_URL);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const data = await response.json();
        if (!data.images || !Array.isArray(data.images))
          throw new Error("Invalid gallery data format");
        const randomizedImages = shuffleArray(data.images);
        setGalleryData({ ...data, images: randomizedImages });
        setCurrentIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGalleryData();
  }, []);

  // Navigation
  const canGoNext = useMemo(
    () => currentIndex < loadedImages.length - 1 || currentPage < totalPages,
    [loadedImages.length, currentIndex, currentPage, totalPages],
  );
  const canGoPrevious = useMemo(
    () => currentIndex > 0 || currentPage > 1,
    [currentIndex, currentPage],
  );

  const nextImage = useCallback(() => {
    if (currentIndex + 1 < loadedImages.length) {
      setCurrentIndex(currentIndex + 1);
    } else if (currentPage < totalPages && !isPaging) {
      setIsPaging(true);
      setCurrentPage(currentPage + 1);
    }
  }, [currentIndex, loadedImages.length, currentPage, totalPages, isPaging]);

  // When new images are loaded after paging, advance to the next image
  useEffect(() => {
    if (!isPaging) return;
    if (loadedImages.length > 0 && currentIndex === loadedImages.length - 1 && currentPage > 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPaging(false);
    }
  }, [loadedImages.length, isPaging, currentIndex, currentPage]);

  const previousImage = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentPage > 1) {
      setIsPaging(true);
      setCurrentPage(currentPage - 1);
      setCurrentIndex(pageSize - 1);
    }
  }, [currentIndex, currentPage, pageSize]);

  const goToImage = useCallback(
    (index: number) => {
      if (index >= 0 && index < loadedImages.length) {
        setCurrentIndex(index);
      }
    },
    [loadedImages.length],
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

  return {
    allImages: images,
    canGoNext,
    canGoPrevious,
    currentIndex,
    currentPage,
    error,
    getImageDimensions,
    goToImage,
    images: loadedImages,
    isLoading,
    isPaging,
    nextImage,
    nextPage,
    previousImage,
    previousPage,
    setCurrentIndex,
    totalImages: galleryData?.totalImages || 0,
    totalPages,
  };
}
