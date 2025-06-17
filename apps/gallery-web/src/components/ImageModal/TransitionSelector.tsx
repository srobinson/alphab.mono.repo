import React from "react";

export type TransitionSelectorProps = {
  transitions: { key: string; label: string }[];
  transitionType: string;
  onSelect: (key: string) => void;
};

export function TransitionSelector({
  transitions,
  transitionType,
  onSelect,
}: TransitionSelectorProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-black/40 rounded-lg p-2">
      {transitions.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className={`px-3 py-1 rounded ${transitionType === t.key ? "bg-white/80 text-black" : "bg-black/30 text-white"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
