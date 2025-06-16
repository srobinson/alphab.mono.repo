import { useState, useEffect, useCallback } from "react";
import debounce from "../utils/debounce";

interface UseInfiniteGalleryPagingArgs {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  nextPage: () => void;
  previousPage: () => void;
}

export function useInfiniteGalleryPaging({
  currentPage,
  totalPages,
  isLoading,
  nextPage,
  previousPage,
}: UseInfiniteGalleryPagingArgs) {
  const [isPaging, setIsPaging] = useState(false);

  // Infinite scroll: Load next page when near bottom
  useEffect(() => {
    if (currentPage >= totalPages || isLoading || isPaging) {
      return;
    }
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      const triggerDistance = 500;
      if (pageHeight - scrollPosition < triggerDistance && !isPaging) {
        setIsPaging(true);
        nextPage();
      }
    };
    const debouncedScroll = debounce(handleScroll, 300);
    window.addEventListener("scroll", debouncedScroll);
    return () => {
      window.removeEventListener("scroll", debouncedScroll);
    };
  }, [currentPage, totalPages, isLoading, isPaging, nextPage]);

  // Reset isPaging when images are loaded
  useEffect(() => {
    const handleImagesLoaded = () => {
      setIsPaging(false);
    };
    window.addEventListener("imagesLoaded", handleImagesLoaded);
    return () => {
      window.removeEventListener("imagesLoaded", handleImagesLoaded);
    };
  }, []);

  // Handle next page button click
  const handleNextPage = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (currentPage >= totalPages || isLoading || isPaging) {
        return;
      }
      setIsPaging(true);
      nextPage();
    },
    [currentPage, totalPages, isLoading, isPaging, nextPage],
  );

  // Handle previous page button click
  const handlePreviousPage = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (currentPage <= 1 || isLoading || isPaging) {
        return;
      }
      previousPage();
    },
    [currentPage, isLoading, isPaging, previousPage],
  );

  return {
    isPaging,
    setIsPaging,
    handleNextPage,
    handlePreviousPage,
  };
}
