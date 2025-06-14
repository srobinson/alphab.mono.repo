import { useState, useEffect, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useImageLoader } from "./hooks/use-image-loader";
import { useImageGallery } from "./hooks/use-image-gallery";
import { SimpleMasonry } from "./hooks/use-masonary-hook";
import "./gallery.css";

const GalleryImage = ({
  image,
  index,
  onClick,
}: {
  image: Image;
  index: number;
  onClick: (image: Image) => void;
}) => {
  const { src: loadedSrc, isLoaded } = useImageLoader(image.thumbnail, image.full);

  return (
    <motion.div
      key={`${image.thumbnail}-${index}`}
      className="masonry-item relative overflow-hidden rounded-lg cursor-pointer group"
      layoutId={`card-${image.thumbnail}`}
      onClick={() => onClick(image)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Background blur image - always visible while loading */}
      <img
        src={image.thumbnail}
        alt="Gallery background"
        className="w-full h-auto object-cover transition-opacity duration-500"
        style={{
          filter: "blur(10px) saturate(1.1)",
          transform: "scale(1.05)",
          opacity: isLoaded ? 0 : 1,
        }}
      />

      {/* Main image - fades in when loaded */}
      <img
        src={loadedSrc}
        alt="Gallery image"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{
          opacity: isLoaded ? 1 : 0,
        }}
      />

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
    </motion.div>
  );
};

// Modal image component with progressive loading
const ModalImage = ({
  image,
  imageZoom,
  onDoubleClick,
}: {
  image: Image;
  imageZoom: number;
  onDoubleClick: () => void;
}) => {
  const { src: loadedSrc, isLoaded } = useImageLoader(image.thumbnail, image.full);

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Background blur image */}
      <img
        src={image.thumbnail}
        alt="Loading background"
        className="absolute inset-0 w-screen h-screen object-cover transition-opacity duration-500"
        style={{
          filter: "blur(20px) saturate(.5)",
          transform: "scale(1.1)",
          opacity: 1,
        }}
      />

      {/* Main high-res image */}
      <motion.img
        src={loadedSrc}
        alt="Full resolution"
        className="relative block transition-opacity duration-1000"
        style={{
          // objectFit: imageZoom === 1 ? "cover" : imageZoom === 2 ? "contain" : "cover",
          maxHeight: imageZoom === 1 ? "" : imageZoom === 2 ? "100vw" : "100vh",
          maxWidth: imageZoom === 1 ? "-webkit-fill-available" : imageZoom === 2 ? "" : "",
          opacity: isLoaded ? 1 : 0,
        }}
        animate={
          {
            // maxHeight: imageZoom === 1 ? "" : imageZoom === 2 ? "" : "100vh",
          }
        }
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        onDoubleClick={onDoubleClick}
      />
      <LoadingProgress isLoaded={isLoaded} />
    </div>
  );
};

function LoadingProgress({ isLoaded }: { isLoaded: boolean }) {
  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
          initial={{ opacity: 0, paddingTop: "10vw" }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-[50vw] max-w-sm h-[3px] bg-white/10 rounded-full shadow-lg border border-white/20 overflow-hidden">
            <motion.div
              className="h-full bg-white/80 rounded-full"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface Image {
  full: string;
  thumbnail: string;
}

function App() {
  const {
    images,
    currentIndex,
    totalImages,
    isLoading,
    error,
    nextImage,
    previousImage,
    goToImage,
    setCurrentImage,
    getRandomImage,
    findImageIndex,
  } = useImageGallery();

  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [direction, setDirection] = useState(0);

  const heroImage = useMemo(() => {
    return images.length > 0 ? images[0] : null;
  }, [images]);

  const { src: heroSrc, isLoaded: isHeroLoaded } = useImageLoader(
    heroImage?.thumbnail,
    heroImage?.full,
  );

  const galleryImages = useMemo(() => {
    if (!heroImage) return images || [];
    return images.filter((img) => img.thumbnail !== heroImage.thumbnail);
  }, [images, heroImage]);

  const changeImage = (direction: number) => {
    if (!selectedImage) return;

    const currentSelectedIndex = findImageIndex(selectedImage);
    if (currentSelectedIndex === -1) return;

    goToImage(currentSelectedIndex);
    const nextImg = direction > 0 ? nextImage() : previousImage();

    if (nextImg) {
      setSelectedImage(nextImg);
      setDirection(direction);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      } else if (e.key === "ArrowRight") {
        changeImage(1);
      } else if (e.key === "ArrowLeft") {
        changeImage(-1);
      } else if (e.key === " ") {
        e.preventDefault();
        const randomImg = getRandomImage();
        if (randomImg && selectedImage) {
          setSelectedImage(randomImg);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  const scrollToGrid = () => {
    document.getElementById("gallery-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
    setCurrentImage(image);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading gallery...</p>
          <p className="text-sm text-white/60 mt-2">
            {totalImages > 0 ? `Fetching ${totalImages} images...` : "Fetching images..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Failed to Load Gallery</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!images.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🖼️</div>
          <p className="text-lg">No images found in gallery</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section */}
      <header className="h-screen w-full relative flex flex-col items-center justify-center text-white overflow-hidden">
        {/* Background Images */}
        {heroImage && (
          <>
            <img
              src={heroImage.thumbnail}
              alt="Loading background"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                filter: "blur(20px) saturate(0.8)",
                transform: "scale(1.1)",
                opacity: isHeroLoaded ? 0 : 1,
                transition: "opacity 0.5s ease",
              }}
            />
            {heroSrc && (
              <img
                src={heroSrc}
                alt="Main content"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: isHeroLoaded ? 1 : 0,
                  transition: "opacity ease 1.5s",
                }}
              />
            )}
          </>
        )}

        {/* Hero Content */}
        <div
          className="relative z-20 text-center p-4"
          style={{
            fontSize: isHeroLoaded ? "8vw" : "10vw",
            opacity: isHeroLoaded ? 0 : 0.8,
            transform: isHeroLoaded ? "translateY(0) scale(1)" : "translateY(4px) scale(1.1)",
            transition:
              "font-size ease-out .100s 1.3s, transform ease-out .500s 1.3s, opacity ease-out 1s 1.3s",
          }}
        >
          <h1 className="md:text-10xl pb-0 font-bold tracking-tighter">Ephemeral Art</h1>
          <p className="text-lg md:text-xl text-white/90">
            A curated collection of {totalImages} textures and patterns.
          </p>
        </div>

        <LoadingProgress isLoaded={isHeroLoaded} />

        {/* Scroll Button */}
        <button
          onClick={scrollToGrid}
          className="absolute bottom-10 z-20 text-white/80 hover:text-white transition-colors"
          style={{
            opacity: isHeroLoaded ? 1 : 0,
            transition: "opacity 1s ease 0.5s",
          }}
        >
          <ChevronDown size={48} className="animate-bounce" />
        </button>
      </header>

      {/* Gallery Grid */}
      {isHeroLoaded && galleryImages.length > 0 && (
        <main id="gallery-grid" className="w-full px-2 py-2">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-2" />

          <SimpleMasonry>
            {galleryImages.map((image, index) => (
              <motion.div
                key={`${image.thumbnail}-${index}`} // More stable key
                className="masonry-item"
                layoutId={`card-${image.thumbnail}`}
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.thumbnail}
                  alt="Gallery background"
                  className="gallery-image gallery-image-bg w-full"
                />
                <img
                  src={image.thumbnail}
                  alt="Gallery foreground"
                  className="gallery-image gallery-image-fg w-full"
                />
              </motion.div>
            ))}
          </SimpleMasonry>

          <div className="text-center mt-16 text-white/60">
            <p>
              Showing {galleryImages.length} of {totalImages} images
            </p>
            <p className="text-sm mt-2">
              Press ESC to close • Arrow keys to navigate • Space for random
            </p>
          </div>
        </main>
      )}

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setSelectedImage(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={selectedImage.thumbnail}
                className="relative flex items-center justify-center w-screen h-full"
                custom={direction}
                variants={{
                  enter: (direction: number) => ({
                    // x: direction > 0 ? "100%" : "-100%",
                    opacity: 0,
                  }),
                  center: {
                    zIndex: 1,
                    // x: 0,
                    opacity: 1,
                  },
                  exit: (direction: number) => ({
                    zIndex: 0,
                    // x: direction < 0 ? "100%" : "-100%",
                    opacity: 0,
                  }),
                }}
                initial="center"
                animate="center"
                exit="center"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
              >
                <ModalImage
                  image={selectedImage}
                  imageZoom={imageZoom}
                  onDoubleClick={() =>
                    setImageZoom(
                      imageZoom === 1 ? 2 : imageZoom === 2 ? 3 : imageZoom === 3 ? 1 : 1,
                    )
                  }
                />
              </motion.div>
            </AnimatePresence>

            {/* Close button */}
            <motion.button
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/30 text-white/70 hover:text-white hover:bg-black/50 transition-colors"
              onClick={() => setSelectedImage(null)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.3 } }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <X size={24} />
            </motion.button>

            {/* Image counter */}
            <motion.div
              className="absolute bottom-4 left-4 z-20 px-3 py-1 rounded-full bg-black/30 text-white/70 text-sm"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.3 } }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              {images.findIndex((img) => img.thumbnail === selectedImage.thumbnail) + 1} /{" "}
              {totalImages} " " [{imageZoom}]
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
