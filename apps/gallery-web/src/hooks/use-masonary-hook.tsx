import { useState, useEffect } from "react";
import { getResponsiveColumns } from "../utils/device";

// Simple masonry layout component that distributes children into columns
interface SimpleMasonryProps {
  children: React.ReactNode[];
  columns?: number;
}

export function SimpleMasonry({ children, columns = 4 }: SimpleMasonryProps) {
  const [cols, setCols] = useState(() => getResponsiveColumns(columns));

  // Update columns on window resize
  useEffect(() => {
    const handleResize = () => setCols(getResponsiveColumns(columns));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [columns]);

  // Distribute children into columns
  const columnArrays = Array.from({ length: cols }, () => [] as React.ReactNode[]);

  children.forEach((child, index) => {
    columnArrays[index % cols].push(child);
  });

  return (
    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
      {columnArrays.map((column, colIndex) => (
        <div
          key={colIndex}
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}
        >
          {column}
        </div>
      ))}
    </div>
  );
}
