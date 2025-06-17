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
    </>
  );
}
