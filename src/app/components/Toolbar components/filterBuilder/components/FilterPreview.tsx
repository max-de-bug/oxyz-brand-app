import React from "react";
import { FilterValues } from "@/app/store/filterStore";

interface FilterPreviewProps {
  filter: FilterValues;
  imageUrl?: string;
  className?: string;
  height?: string;
}

export const FilterPreview: React.FC<FilterPreviewProps> = ({
  filter,
  imageUrl,
  className = "",
  height = "h-16",
}) => {
  const filterStyle = {
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    filter: `
      brightness(${filter.brightness}%) 
      contrast(${filter.contrast}%) 
      saturate(${filter.saturation}%) 
      sepia(${filter.sepia}%)
      blur(${filter.blur}px)
    `,
    opacity: `${filter.opacity}%`,
  };

  return (
    <div className={className}>
      <div className="text-xs text-center mb-1">Preview</div>
      <div
        className={`${height} bg-cover bg-center rounded ${
          !imageUrl ? "bg-gradient-to-r from-blue-400 to-purple-500" : ""
        }`}
        style={filterStyle}
      />
    </div>
  );
};
