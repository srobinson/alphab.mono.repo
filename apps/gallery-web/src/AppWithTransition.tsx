import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import App from "./App";

// CSS-in-JS approach as fallback
const fadeInStyles = {
  opacity: 0,
  transform: "translateY(20px)",
  transition:
    "opacity 0.8s cubic-bezier(0.25, 0.25, 0, 1), transform 0.8s cubic-bezier(0.25, 0.25, 0, 1)",
};

const fadeInActiveStyles = {
  opacity: 1,
  transform: "translateY(0px)",
};

// Function to hide the initial HTML loading screen
const hideInitialLoadingScreen = (): Promise<void> => {
  return new Promise((resolve) => {
    const initialLoading = document.getElementById("initial-loading");
    if (initialLoading) {
      console.log("Removing persist class and starting fade-out");
      // Remove persist class first
      initialLoading.classList.remove("persist");
      // Add fade-out class
      initialLoading.classList.add("fade-out");
      setTimeout(() => {
        initialLoading.remove();
        console.log("Loading screen removed");
        resolve();
      }, 300); // Match CSS animation duration
    } else {
      resolve();
    }
  });
};

const AppWithTransition = () => {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      console.log("Starting app initialization...");

      // Wait for minimum loading time first (while HTML loading screen shows)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Minimum loading time completed");

      // Now hide the HTML loading screen
      await hideInitialLoadingScreen();
      console.log("HTML loading screen hidden");

      // Small delay to ensure smooth transition
      setTimeout(() => {
        console.log("Setting app ready to true");
        setAppReady(true);
      }, 100);
    };

    // Start immediately - no additional delay
    initializeApp();
  }, []);

  console.log("AppWithTransition render, appReady:", appReady);

  return (
    <div className="min-h-screen">
      <motion.div
        key={`app-${Date.now()}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.25, 0, 1],
          opacity: { duration: 0.6 },
          y: { duration: 0.6 },
        }}
        className="min-h-screen"
        onAnimationStart={() => console.log("Animation started")}
        onAnimationComplete={() => console.log("Animation completed")}
        style={{
          willChange: "opacity, transform",
        }}
      >
        <App />
      </motion.div>
    </div>
  );
};

export default AppWithTransition;
