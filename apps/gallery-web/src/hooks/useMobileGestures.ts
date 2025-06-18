import { useCallback, useState } from "react";
import { useIsMobile } from "../utils/device";

interface UseMobileGesturesProps {
  // TODO: DO we need these
  onDragStart?: () => void;
  onDragEnd?: () => void;

  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  disabled?: boolean;
  swipeThreshold?: number;
  // Panning coordination
  isPanningEnabled?: boolean;
}

interface GestureState {
  isSwipeActive: boolean;
  swipeDirection: "left" | "right" | "up" | "down" | null;
  lastTap: number;
}

interface TouchStart {
  x: number;
  y: number;
  time: number;
}

export function useMobileGestures({
  onDragStart,
  onDragEnd,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  disabled = false,
  swipeThreshold = 50,
  isPanningEnabled = false,
}: UseMobileGesturesProps) {
  const [gestureState, setGestureState] = useState<GestureState>({
    isSwipeActive: false,
    swipeDirection: null,
    lastTap: 0,
  });

  const [touchStart, setTouchStart] = useState<TouchStart | null>(null);
  const [isGestureActive, setIsGestureActive] = useState(false);

  // Use centralized mobile detection
  const isMobile = useIsMobile();

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !isMobile) return;

      const touch = e.touches[0];
      const now = Date.now();

      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: now,
      });

      // Check for double tap
      const timeSinceLastTap = now - gestureState.lastTap;
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        console.log("🎯 Double Tap Detected:", { timeSinceLastTap });
        onDoubleTap?.();
      }

      setGestureState((prev) => ({ ...prev, lastTap: now }));
      setIsGestureActive(true);

      // console.log("🎯 Touch Start:", { x: touch.clientX, y: touch.clientY });
    },
    [disabled, isMobile, gestureState.lastTap, onDoubleTap],
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !isMobile || !touchStart) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      const horizontalDistance = Math.abs(deltaX);
      const verticalDistance = Math.abs(deltaY);

      // Determine primary direction
      let direction: "left" | "right" | "up" | "down";
      if (horizontalDistance > verticalDistance) {
        direction = deltaX > 0 ? "right" : "left";
      } else {
        direction = deltaY > 0 ? "down" : "up";
      }

      setGestureState((prev) => ({
        ...prev,
        isSwipeActive: true,
        swipeDirection: direction,
      }));

      console.log("🎯 Touch Move:", {
        deltaX,
        deltaY,
        direction,
        horizontalDistance,
        verticalDistance,
      });
    },
    [disabled, isMobile, touchStart],
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !isMobile || !touchStart) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const deltaTime = Date.now() - touchStart.time;

      const horizontalDistance = Math.abs(deltaX);
      const verticalDistance = Math.abs(deltaY);
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

      console.log("🎯 Touch End:", {
        deltaX,
        deltaY,
        horizontalDistance,
        verticalDistance,
        velocity,
        threshold: swipeThreshold,
      });

      // Adjust thresholds based on panning state
      const effectiveThreshold = isPanningEnabled ? swipeThreshold * 2 : swipeThreshold;
      const effectiveVelocityThreshold = isPanningEnabled ? 1.0 : 0.5;

      // Check if swipe threshold met
      if (
        horizontalDistance > effectiveThreshold ||
        verticalDistance > effectiveThreshold ||
        velocity > effectiveVelocityThreshold
      ) {
        if (horizontalDistance >= verticalDistance) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            console.log("🎯 Triggering swipe RIGHT", { isPanningEnabled, effectiveThreshold });
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            console.log("🎯 Triggering swipe LEFT", { isPanningEnabled, effectiveThreshold });
            onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY < 0 && onSwipeUp) {
            console.log("🎯 Triggering swipe UP", { isPanningEnabled, effectiveThreshold });
            onSwipeUp();
          } else if (deltaY > 0 && onSwipeDown) {
            console.log("🎯 Triggering swipe DOWN", { isPanningEnabled, effectiveThreshold });
            onSwipeDown();
          }
        }
      } else if (isPanningEnabled) {
        console.log("🎯 Touch event allowed to pass through for panning", {
          horizontalDistance,
          verticalDistance,
          effectiveThreshold,
          velocity,
          effectiveVelocityThreshold,
        });
      }

      // Reset state
      setTouchStart(null);
      setIsGestureActive(false);
      setGestureState((prev) => ({
        ...prev,
        isSwipeActive: false,
        swipeDirection: null,
      }));
    },
    [
      disabled,
      isMobile,
      touchStart,
      swipeThreshold,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
    ],
  );

  // Create gesture bindings object (React event handlers)
  const bind = useCallback(
    () => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }),
    [handleTouchStart, handleTouchMove, handleTouchEnd],
  );

  // Haptic feedback
  const triggerHaptic = useCallback(
    (type: "light" | "medium" | "heavy" = "light") => {
      if ("vibrate" in navigator && isMobile) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30],
        };
        navigator.vibrate(patterns[type]);
      }
    },
    [isMobile],
  );

  // Swipe indicators for visual feedback
  const getSwipeIndicator = useCallback(() => {
    if (!gestureState.isSwipeActive || !gestureState.swipeDirection) return null;

    return {
      direction: gestureState.swipeDirection,
      opacity: 0.6,
      scale: 1.1,
    };
  }, [gestureState.isSwipeActive, gestureState.swipeDirection]);

  // console.log("🎯 Native touch events ready:", {
  //   isMobile,
  //   disabled,
  //   touchStart: !!touchStart,
  //   isGestureActive,
  //   bindKeys: Object.keys(bind()),
  // });

  return {
    bind,
    gestureState,
    isGestureActive,
    triggerHaptic,
    getSwipeIndicator,
    isMobile,
  };
}
