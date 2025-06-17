import React, { useState, useRef } from "react";
import { motion } from "framer-motion";

// Demo images (replace with your own for more beauty!)
const IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80",
];

export default function StunningZipperDemo() {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fromImg, setFromImg] = useState(IMAGES[0]);
  const [toImg, setToImg] = useState(IMAGES[1]);
  const [showZipper, setShowZipper] = useState(false);

  // Animation completion tracking
  const leftDone = useRef(false);
  const rightDone = useRef(false);

  // Start zipper transition
  const triggerZipper = () => {
    if (isAnimating) return;
    setFromImg(IMAGES[index]);
    setToImg(IMAGES[(index + 1) % IMAGES.length]);
    setShowZipper(true);
    setIsAnimating(true);
    leftDone.current = false;
    rightDone.current = false;
  };

  // Called when each half finishes
  const onHalfDone = (side: "left" | "right") => {
    if (side === "left") leftDone.current = true;
    if (side === "right") rightDone.current = true;
    if (leftDone.current && rightDone.current) {
      setTimeout(() => {
        setIndex((i) => (i + 1) % IMAGES.length);
        setShowZipper(false);
        setIsAnimating(false);
      }, 100); // slight delay for polish
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#18181b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 480,
          height: 320,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)",
        }}
      >
        {/* New image as background */}
        <img
          src={IMAGES[index]}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: isAnimating ? "brightness(0.98) blur(0.5px)" : "none",
            transition: "filter 0.3s",
          }}
        />
        {/* Zipper overlay */}
        {showZipper && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            {/* New image as background */}
            <img
              src={toImg}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
                zIndex: 1,
                filter: "brightness(1)",
              }}
            />
            {/* Left half */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "-100%" }}
              transition={{ duration: 0.7, ease: [0.7, 0, 0.84, 0] }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "50%",
                height: "100%",
                overflow: "hidden",
                zIndex: 2,
                boxShadow: "2px 0 16px 0 rgba(0,0,0,0.18)",
              }}
              onAnimationComplete={() => onHalfDone("left")}
            >
              {/* Center line */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.25, ease: "easeIn" }}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 4,
                  height: "100%",
                  background: "linear-gradient(180deg, #fff 0%, #000 100%)",
                  borderRadius: 8,
                  zIndex: 10,
                  boxShadow: "0 0 12px 2px #0008",
                  transformOrigin: "top center",
                }}
              />
              <img
                src={fromImg}
                alt=""
                style={{
                  width: "200%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "translateX(0%)",
                  clipPath: "inset(0 50% 0 0)",
                  filter: "brightness(1)",
                }}
              />
            </motion.div>
            {/* Right half */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "100%" }}
              transition={{ duration: 0.7, ease: [0.7, 0, 0.84, 0] }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "50%",
                height: "100%",
                overflow: "hidden",
                zIndex: 2,
                boxShadow: "-2px 0 16px 0 rgba(0,0,0,0.18)",
              }}
              onAnimationComplete={() => onHalfDone("right")}
            >
              {/* Center line */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.25, ease: "easeIn" }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 4,
                  height: "100%",
                  background: "linear-gradient(180deg, #fff 0%, #000 100%)",
                  borderRadius: 8,
                  zIndex: 10,
                  boxShadow: "0 0 12px 2px #0008",
                  transformOrigin: "top center",
                }}
              />
              <img
                src={fromImg}
                alt=""
                style={{
                  width: "200%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "translateX(-50%)",
                  clipPath: "inset(0 0 0 50%)",
                  filter: "brightness(1)",
                }}
              />
            </motion.div>
          </div>
        )}
        {/* Click to trigger zipper */}
        {!isAnimating && (
          <button
            onClick={triggerZipper}
            style={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              padding: "12px 32px",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 20,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px 0 #0006",
              transition: "background 0.2s",
            }}
          >
            Zipper Transition →
          </button>
        )}
      </div>
    </div>
  );
}
