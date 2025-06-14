import { useState, useEffect, useMemo } from "react";
import Masonry from "react-masonry-css";
import { ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useImageLoader } from "./hooks/use-image-loader";
import { useImageGallery } from "./hooks/use-image-gallery";
import "./gallery.css";

interface Image {
  full: string;
  thumbnail: string;
}

function App() {
  const {
    images,
    currentImage,
    currentIndex,
    totalImages,
    isLoading,
    error,
    nextImage,
    previousImage,
    setCurrentImage,
    getRandomImage,
  } = useImageGallery();

  console.log("images", images);

  // const [images, setImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [direction, setDirection] = useState(0);

  const heroImage = useMemo(() => {
    return images.length > 0 ? images[0] : null;
  }, [images]);

  const { src: heroSrc, isLoaded: isHeroLoaded } = useImageLoader(
    heroImage?.thumbnail,
    heroImage?.full,
  );

  // useEffect(() => {
  //   const fetchImages = async () => {
  //     try {
  //       const response = await fetch("/images.json");
  //       if (!response.ok) {
  //         throw new Error("Failed to fetch images.");
  //       }
  //       let data = await response.json();
  //       data.sort(() => Math.random() - 0.5);
  //       setImages(data);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   fetchImages();
  // }, []);

  const changeImage = (newDirection: number) => {
    if (!selectedImage) return;

    // Find current selected image in the gallery
    const currentSelectedIndex = images.findIndex(
      (img) => img.thumbnail === selectedImage.thumbnail,
    );

    let nextImg: Image | null = null;

    if (newDirection > 0) {
      // Go to next image
      if (currentSelectedIndex < images.length - 1) {
        nextImg = images[currentSelectedIndex + 1];
      } else {
        nextImg = images[0]; // Loop to beginning
      }
    } else {
      // Go to previous image
      if (currentSelectedIndex > 0) {
        nextImg = images[currentSelectedIndex - 1];
      } else {
        nextImg = images[images.length - 1]; // Loop to end
      }
    }

    if (nextImg) {
      setSelectedImage(nextImg);
      setDirection(newDirection);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        changeImage(1);
      } else if (e.key === "ArrowLeft") {
        changeImage(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, images]);

  // Remove the old fetchImages useEffect - the hook handles this now

  const galleryImages = useMemo(() => {
    if (!heroImage) return images || [];
    return images.filter((img) => img.thumbnail !== heroImage.thumbnail);
  }, [images, heroImage]);

  const scrollToGrid = () => {
    document.getElementById("gallery-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
    setIsZoomed(false);
  };

  const handleClose = () => {
    setSelectedImage(null);
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zed-background text-zed-foreground">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading gallery...</p>
          <p className="text-sm text-white/60 mt-2">Fetching and randomizing images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-zed-background text-zed-foreground">
      <header className="h-screen w-full relative flex flex-col items-center justify-center text-white overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-black/50 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        {/* Blurred thumbnail, shown immediately and fades out */}
        <motion.img
          src={heroImage.thumbnail}
          alt="Loading background"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "blur(20px) saturate(1.2)", transform: "scale(1.1)" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: isHeroLoaded ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Full resolution image, fades in when loaded */}
        <motion.img
          src={heroSrc}
          alt="Main content"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHeroLoaded ? 1 : 0 }}
          transition={{ duration: 1.5 }}
        />

        <motion.div
          className="relative z-20 text-center p-4"
          variants={textVariants}
          initial="hidden"
          animate={isHeroLoaded ? "visible" : "hidden"}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 shadow-text">
            Ephemeral Art
          </h1>

          <AnimatePresence>
            {!isHeroLoaded && (
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                initial={{ opacity: 1, paddingTop: 30 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 15 }}
              >
                <div className="w-[50vw] max-w-sm h-[3px] bg-white/10 rounded-full shadow-lg border border-white/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-white/80 rounded-full"
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-lg md:text-xl text-white/90 shadow-text">
            A curated collection of textures and patterns.
          </p>
        </motion.div>

        <motion.button
          onClick={scrollToGrid}
          className="absolute bottom-10 z-20 text-white/80 hover:text-white"
          aria-label="Scroll down"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHeroLoaded ? 1 : 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={48} />
          </motion.div>
        </motion.button>
      </header>

      {galleryImages.length > 0 && (
        <main id="gallery-grid" className="w-full px-4 py-16">
          <div
            className="w-full h-px bg-transparent mb-16"
            style={{
              background:
                "linear-gradient(to right, transparent, hsl(var(--border-muted)), transparent)",
            }}
          />
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {galleryImages.map((image) => (
              <motion.div
                key={image.thumbnail}
                className="masonry-item"
                layoutId={`card-${image.thumbnail}`}
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.thumbnail}
                  alt="Gallery background"
                  className="gallery-image gallery-image-bg"
                />
                <img
                  src={image.thumbnail}
                  alt="Gallery foreground"
                  className="gallery-image gallery-image-fg"
                />
              </motion.div>
            ))}
          </Masonry>
        </main>
      )}

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full h-full max-w-[90vw] max-h-[90vh]"
              layoutId={`card-${selectedImage.thumbnail}`}
            >
              <motion.img
                src={selectedImage.thumbnail}
                alt="Blurred background"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "blur(20px)" }}
              />
              <motion.img
                src={selectedImage.full}
                alt="Full resolution"
                className="relative w-full h-full object-contain"
              />
            </motion.div>
            <motion.button
              className="absolute top-4 right-4 text-white"
              onClick={handleClose}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.3 } }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <X size={32} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
