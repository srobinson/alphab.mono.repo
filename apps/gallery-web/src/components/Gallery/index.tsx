import { Gallery } from "./Gallery";
import { useGallery } from "./useGallery";
import type { GalleryContainerProps } from "./useGallery";

export default function GalleryContainer(props: GalleryContainerProps) {
  const galleryProps = useGallery(props);
  return <Gallery {...galleryProps} />;
}

// Also export the component and types for direct use if needed
export { Gallery };
export type { GalleryContainerProps };
