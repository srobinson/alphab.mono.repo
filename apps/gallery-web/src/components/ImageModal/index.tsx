import { useImageModal } from "../../hooks/useImageModal";
import { ImageModal } from "./ImageModal";
import type { ImageModalContainerProps } from "./types";

export default function ImageModalContainer({ core }: ImageModalContainerProps) {
  const hookReturn = useImageModal({
    image: core.image,
    imageDimensions: core.imageDimensions,
    isPaging: core.isPaging,
    onClose: core.onClose,
    onNextImage: core.onNextImage,
    onPreviousImage: core.onPreviousImage,
  });

  // Group the hook return into logical objects
  const groupedProps = {
    core,
    state: {
      loadedSrc: hookReturn.loadedSrc,
      isLoaded: hookReturn.isLoaded,
      hasError: hookReturn.hasError,
      isExiting: hookReturn.isExiting,
      setIsExiting: hookReturn.setIsExiting,
    },
    zoom: {
      imageZoom: hookReturn.imageZoom,
      setImageZoom: hookReturn.setImageZoom,
      handleZoomCycle: hookReturn.handleZoomCycle,
      zoomLabel: hookReturn.zoomLabel,
      getZoomStyles: hookReturn.getZoomStyles,
    },
    pan: {
      isPanning: hookReturn.isPanning,
      setIsPanning: hookReturn.setIsPanning,
      isPanningEnabled: hookReturn.isPanningEnabled,
      panConstraints: hookReturn.panConstraints,
      showPanHint: hookReturn.showPanHint,
      setShowPanHint: hookReturn.setShowPanHint,
    },
    mobile: {
      mobileGestureBindings: hookReturn.mobileGestureBindings,
      isGestureActive: hookReturn.isGestureActive,
      swipeIndicator: hookReturn.swipeIndicator,
      isMobile: hookReturn.isMobile,
      triggerHaptic: hookReturn.triggerHaptic,
      gestureState: hookReturn.gestureState,
    },
    refs: {
      containerRef: hookReturn.containerRef,
      imgControls: hookReturn.imgControls,
      imgRef: hookReturn.imgRef,
    },
  };

  return <ImageModal {...groupedProps} />;
}

// Also export the component and types for direct use if needed
export { ImageModal };
export type { ImageModalContainerProps };
