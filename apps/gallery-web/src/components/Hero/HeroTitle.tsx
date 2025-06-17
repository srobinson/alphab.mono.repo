import React from "react";

export function HeroTitle({ isLoaded, totalImages }: { isLoaded: boolean; totalImages: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div
        className="text-center p-4"
        style={{
          fontSize: isLoaded ? "8vw" : "14vw",
          opacity: isLoaded ? 0.5 : 0.8,
          transform: isLoaded ? "translateY(0) scale(1)" : "translateY(4px) scale(1.1)",
          transition:
            "font-size ease-out .100s 1.3s, transform ease-out .500s 1.3s, opacity ease-out 1s 1.3s",
        }}
      >
        <h1 className="md:text-10xl pb-0 font-extrabold uppercase leading-none tracking-tighter text-white/90">
          Ephemeral Art
        </h1>
        <p className="text-lg md:text-xl uppercase text-white/90">
          A curated collection of {totalImages} textures and patterns.
        </p>
      </div>
    </div>
  );
}
