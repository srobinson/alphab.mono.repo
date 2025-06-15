import { useState, useEffect } from "react";

// Simple masonry layout component that distributes children into columns
interface SimpleMasonryProps {
  children: React.ReactNode[];
  columns?: number;
}

export function SimpleMasonry({ children, columns = 4 }: SimpleMasonryProps) {
  // Determine number of columns based on window width
  const getColumns = () => {
    const width = window.innerWidth;
    if (width < 500) return 1;
    if (width < 700) return 2;
    if (width < 1100) return 3;
    return columns;
  };

  const [cols, setCols] = useState(getColumns());

  // Update columns on window resize
  useEffect(() => {
    const handleResize = () => setCols(getColumns());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
