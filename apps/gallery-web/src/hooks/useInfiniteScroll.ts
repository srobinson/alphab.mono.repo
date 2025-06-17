import { useEffect } from "react";

interface UseInfiniteScrollProps {
  onLoadMore: () => void;
  threshold?: number;
}

export function useInfiniteScroll({ onLoadMore, threshold = 300 }: UseInfiniteScrollProps) {
  useEffect(() => {
    const handleScroll = () => {
      const scrolledTo = window.scrollY + window.innerHeight + threshold;
      const scrollHeight = document.body.scrollHeight;
      const isAtBottom = scrolledTo > scrollHeight;

      if (isAtBottom) {
        onLoadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onLoadMore, threshold]);
}
