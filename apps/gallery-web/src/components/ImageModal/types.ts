// ============================================================================
// MODAL COMPONENT INTERFACES
// ============================================================================

// Core image data and basic modal actions
export interface ImageModalCoreProps {
  image: { full: string; thumbnail: string };
  imageDimensions?: { width: number; height: number } | null;
  isPaging?: boolean;
  onClose: () => void;
  // Navigation for keyboard/gesture support
  onNextImage?: () => void;
  onPreviousImage?: () => void;
}

// All zoom-related functionality
export interface ZoomProps {
  imageZoom: 1 | 2 | 3;
  setImageZoom: (z: 1 | 2 | 3) => void;
  handleZoomCycle: () => void; // Double-click and space key cycling
  zoomLabel: string; // "1x", "2x", "3x" display
  getZoomStyles: (zoom: number) => any;
}

// All pan/drag functionality
export interface PanProps {
  isPanning: boolean; // Active drag state
  setIsPanning: (v: boolean) => void;
  isPanningEnabled: boolean; // Zoom level > 1
  panConstraints: { left: number; right: number; top: number; bottom: number };
  showPanHint: boolean; // First-time user hint
  setShowPanHint: (v: boolean) => void;
}

// Modal loading and state management
export interface ModalStateProps {
  loadedSrc: string; // Progressive loading: thumbnail -> full res
  isLoaded: boolean; // Controls image fade-in animation
  hasError: boolean; // Error state from image loading
  isExiting: boolean; // Animation state
  setIsExiting: (v: boolean) => void;
}

// Mobile gesture functionality
export interface MobileProps {
  mobileGestureBindings?: any; // Gesture event handlers
  isGestureActive?: boolean; // Prevents other interactions during gestures
  swipeIndicator?: {
    // Visual feedback for swipe navigation
    direction: "left" | "right" | "up" | "down";
    opacity: number;
    scale: number;
  } | null;
  isMobile?: boolean; // Mobile-specific styling
  triggerHaptic?: (type?: "light" | "medium" | "heavy") => void; // ❌ UNUSED in current view
  gestureState?: any; // ❌ UNUSED in current view - internal gesture state
}

// Internal React refs and controls
export interface ModalRefsProps {
  containerRef: React.RefObject<HTMLDivElement>; // Drag container
  imgControls: any; // Framer Motion controls
  imgRef: React.RefObject<any>; // Image element ref
}

// ============================================================================
// MAIN COMPONENT INTERFACES
// ============================================================================

// Clean grouped interface for container input
export interface ImageModalContainerProps {
  core: ImageModalCoreProps;
}

// Final props for the view component (grouped objects)
export interface ImageModalProps {
  core: ImageModalCoreProps;
  state: ModalStateProps;
  zoom: ZoomProps;
  pan: PanProps;
  mobile: MobileProps;
  refs: ModalRefsProps;
}
