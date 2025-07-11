import { SimpleMasonry } from "../hooks/use-masonary-hook";
import { GalleryImage } from "./GalleryImage";
import type { Image } from "../hooks/useGallery";

// ============================================================================
// CLEAN PROPS INTERFACE
// ============================================================================

interface GalleryGridProps {
  images: {
    images: Image[]; // Already filtered in parent - no heroImage needed
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalImages: number;
    isLoading: boolean;
    onNextPage: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onPreviousPage: (e: React.MouseEvent<HTMLButtonElement>) => void;
    // REMOVED: isPaging - redundant with isLoading for UI purposes
  };
  selection: {
    lastViewedImage: Image | null;
    onImageClick: (image: Image) => void;
  };
}

export function GalleryGrid({
  images: { images },
  pagination: { currentPage, totalPages, totalImages, isLoading, onNextPage, onPreviousPage },
  selection: { lastViewedImage, onImageClick },
}: GalleryGridProps) {
  // REMOVED: unused refs galleryGridRef and lastImageRef

  return (
    <main id="gallery-grid" tabIndex={-1} className="w-full px-2 py-2 min-h-screen">
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-2" />
      <SimpleMasonry>
        {images.map((image, index) => (
          <GalleryImage
            key={`${image.thumbnail}-${index}`}
            image={image}
            index={index}
            onClick={onImageClick}
            isSelected={!!lastViewedImage && lastViewedImage.thumbnail === image.thumbnail}
            // REMOVED: imageRef prop - not used for any functionality
          />
        ))}
      </SimpleMasonry>

      {/* Loading indicator for additional pages */}
      {isLoading && currentPage > 1 && (
        <div className="text-center my-8">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-white/60">Loading more images...</p>
        </div>
      )}

      {/* Pagination controls */}
      <div className="text-center mt-8 mb-16 text-white/60">
        <p>
          Showing {(currentPage - 1) * 50 + images.length} of {totalImages} images
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={onPreviousPage}
            disabled={currentPage === 1 || isLoading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <span className="self-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages || isLoading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
