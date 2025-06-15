import { motion } from "framer-motion";

interface ImageCounterProps {
  currentIndex: number;
  totalImages: number;
  isLoading: boolean;
}

export function ImageCounter({ currentIndex, totalImages, isLoading }: ImageCounterProps) {
  return (
    <>
      <motion.div
        className="fixed bottom-4 left-4 z-[60] px-3 py-2 rounded-lg bg-black/70 text-white text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        Image {currentIndex} of {totalImages}
      </motion.div>
      {isLoading && (
        <motion.div
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[60] px-4 py-2 rounded-lg bg-black/70 text-white text-sm flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span>Fetching more images...</span>
        </motion.div>
      )}
    </>
  );
}
