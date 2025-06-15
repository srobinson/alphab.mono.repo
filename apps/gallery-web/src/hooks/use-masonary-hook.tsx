import { useState, useEffect } from "react";

interface SimpleMasonryProps {
  children: React.ReactNode[];
  columns?: number;
}

export function SimpleMasonry({ children, columns = 4 }: SimpleMasonryProps) {
  const getColumns = () => {
    const width = window.innerWidth;
    if (width < 500) return 1;
    if (width < 700) return 2;
    if (width < 1100) return 3;
    return columns;
  };

  const [cols, setCols] = useState(getColumns());

  useEffect(() => {
    const handleResize = () => setCols(getColumns());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
