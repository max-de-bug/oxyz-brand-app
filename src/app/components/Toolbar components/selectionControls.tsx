"use client";
import React from "react";
import SizeControls from "./sizeControls";
import PositionControls from "./positionControls";
import { useImageStore } from "@/app/store/imageStore";
import { useDesignStore } from "@/app/store/designStore";

interface SelectionControlsProps {
  // No props needed as we'll get values from stores
}

const SelectionControls: React.FC<SelectionControlsProps> = () => {
  const { logos, updateLogo, selectLogo } = useImageStore();

  const {
    textOverlay,
    setTextRotation,
    setTextSpacing,
    setTextTranslationX,
    setTextTranslationY,
    setTextOverlay,
  } = useDesignStore();

  // Find the selected logo if any
  const selectedLogo = logos.find((logo) => logo.isSelected);
  const isTextSelected = textOverlay.isSelected;

  // Handle size change
  const handleSizeChange = (size: number) => {
    if (selectedLogo) {
      updateLogo(selectedLogo.id, { size: size / 5 });
    } else {
      setTextOverlay({ fontSize: size });
    }
  };

  // Handle rotation change
  const handleRotationChange = (rotation: number) => {
    if (selectedLogo) {
      updateLogo(selectedLogo.id, { rotation });
    } else {
      setTextRotation(rotation);
    }
  };

  // Handle spacing change
  const handleSpacingChange = (spacing: number) => {
    if (isTextSelected) {
      setTextSpacing(spacing);
    }
  };

  // Handle position changes
  const handleXChange = (x: number) => {
    if (selectedLogo) {
      updateLogo(selectedLogo.id, {
        position: { ...selectedLogo.position, x: 50 + x / 10 },
      });
    } else {
      setTextTranslationX(x);
    }
  };

  const handleYChange = (y: number) => {
    if (selectedLogo) {
      updateLogo(selectedLogo.id, {
        position: { ...selectedLogo.position, y: 50 + y / 10 },
      });
    } else {
      setTextTranslationY(y);
    }
  };

  // Get current values based on what's selected
  // For position
  const translationX = selectedLogo
    ? (selectedLogo.position.x - 50) * 10
    : textOverlay.translationX || 0;

  const translationY = selectedLogo
    ? (selectedLogo.position.y - 50) * 10
    : textOverlay.translationY || 0;

  // For size and rotation
  const size = selectedLogo
    ? selectedLogo.size * 5
    : textOverlay.fontSize || 24;

  const rotation = selectedLogo
    ? selectedLogo.rotation || 0
    : textOverlay.rotation || 0;

  const spacing = isTextSelected ? textOverlay.spacing || 0 : 0;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-4">Element Controls</h3>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium mb-4">Position</h4>
        <PositionControls
          translationX={translationX}
          setTranslationX={handleXChange}
          translationY={translationY}
          setTranslationY={handleYChange}
        />
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium mb-4">Size & Rotation</h4>
        <SizeControls
          minSize={1}
          setMinSize={() => {}} // Not used in this context
          maxSize={size}
          setMaxSize={handleSizeChange}
          spacing={spacing}
          setSpacing={handleSpacingChange}
          rotation={rotation}
          setRotation={handleRotationChange}
        />
      </div>
    </div>
  );
};

export default SelectionControls;
