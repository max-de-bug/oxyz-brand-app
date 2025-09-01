"use client";

import { useState, useCallback, useEffect } from "react";

interface MainImageInteractionsProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mainImage: HTMLImageElement | null;
  devMode: boolean;
  showResizeStatus: (message: string) => void;
  renderCanvas: () => void;
}

export const useMainImageInteractions = ({
  canvasRef,
  mainImage,
  devMode,
  showResizeStatus,
  renderCanvas,
}: MainImageInteractionsProps) => {
  // State for main image manipulation
  const [isDraggingMainImage, setIsDraggingMainImage] = useState(false);
  const [mainImagePosition, setMainImagePosition] = useState({ x: 0, y: 0 });
  const [mainImageDragOffset, setMainImageDragOffset] = useState({
    x: 0,
    y: 0,
  });
  const [isResizingMainImage, setIsResizingMainImage] = useState(false);
  const [mainImageScale, setMainImageScale] = useState(1);
  const [initialMainImageScale, setInitialMainImageScale] = useState(1);
  const [mainImageResizeStartPoint, setMainImageResizeStartPoint] = useState({
    x: 0,
    y: 0,
  });

  // Add effect to center image when loaded
  useEffect(() => {
    if (canvasRef.current && mainImage && devMode) {
      const canvas = canvasRef.current;
      const aspectRatio = mainImage.naturalWidth / mainImage.naturalHeight;
      const targetWidth = canvas.width;
      const targetHeight = targetWidth / aspectRatio;

      // Calculate center position
      const x = (canvas.width - targetWidth) / 2;
      const y = (canvas.height - targetHeight) / 2;

      setMainImagePosition({ x, y });
      renderCanvas();
    }
  }, [canvasRef.current, mainImage, devMode, renderCanvas]);

  // Reset image position and scale
  const resetMainImage = useCallback(() => {
    setMainImagePosition({ x: 0, y: 0 });
    setMainImageScale(1);
    renderCanvas();
  }, [renderCanvas]);

  // Handle mouse down for main image
  const handleMainImageMouseDown = useCallback(
    (
      e: MouseEvent,
      resizeCornerSetter: (
        corner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null
      ) => void
    ) => {
      if (!canvasRef.current || !devMode || !mainImage) {
        return false;
      }

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate image dimensions with scale
      const aspectRatio = mainImage.naturalWidth / mainImage.naturalHeight;
      const targetWidth = canvas.width;
      const targetHeight = targetWidth / aspectRatio;

      // Calculate image boundaries with current position and scale
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scaledWidth = targetWidth * mainImageScale;
      const scaledHeight = targetHeight * mainImageScale;

      const left = centerX + mainImagePosition.x - scaledWidth / 2;
      const right = left + scaledWidth;
      const top = centerY + mainImagePosition.y - scaledHeight / 2;
      const bottom = top + scaledHeight;

      // Check if clicking inside the image
      if (
        mouseX >= left &&
        mouseX <= right &&
        mouseY >= top &&
        mouseY <= bottom
      ) {
        // Determine if we're near the edges for resizing
        const edgeThreshold = 20;

        // Check if we're near any corner
        const nearTopLeft =
          mouseX <= left + edgeThreshold && mouseY <= top + edgeThreshold;
        const nearTopRight =
          mouseX >= right - edgeThreshold && mouseY <= top + edgeThreshold;
        const nearBottomLeft =
          mouseX <= left + edgeThreshold && mouseY >= bottom - edgeThreshold;
        const nearBottomRight =
          mouseX >= right - edgeThreshold && mouseY >= bottom - edgeThreshold;

        if (nearTopLeft || nearTopRight || nearBottomLeft || nearBottomRight) {
          setIsResizingMainImage(true);
          setMainImageResizeStartPoint({ x: mouseX, y: mouseY });
          setInitialMainImageScale(mainImageScale);

          if (nearTopLeft) resizeCornerSetter("topLeft");
          else if (nearTopRight) resizeCornerSetter("topRight");
          else if (nearBottomLeft) resizeCornerSetter("bottomLeft");
          else resizeCornerSetter("bottomRight");
        } else {
          setIsDraggingMainImage(true);
          // Store the offset from the mouse position to the image position
          setMainImageDragOffset({
            x: mouseX - (centerX + mainImagePosition.x),
            y: mouseY - (centerY + mainImagePosition.y),
          });
        }
        return true;
      }

      return false;
    },
    [canvasRef, devMode, mainImage, mainImagePosition, mainImageScale]
  );

  // Handle mouse move for main image
  const handleMainImageMouseMove = useCallback(
    (
      e: MouseEvent,
      resizeCorner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null
    ) => {
      if (!canvasRef.current || !devMode || !mainImage) {
        return false;
      }

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const currentMouseX = e.clientX - rect.left;
      const currentMouseY = e.clientY - rect.top;

      // Handle main image dragging
      if (isDraggingMainImage) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Calculate new position by subtracting the drag offset from the current mouse position
        const newX = currentMouseX - mainImageDragOffset.x - centerX;
        const newY = currentMouseY - mainImageDragOffset.y - centerY;

        // Calculate constraints
        const aspectRatio = mainImage.naturalWidth / mainImage.naturalHeight;
        const targetWidth = canvas.width;
        const targetHeight = targetWidth / aspectRatio;
        const scaledWidth = targetWidth * mainImageScale;
        const scaledHeight = targetHeight * mainImageScale;

        // Calculate boundaries
        const maxX = (canvas.width + scaledWidth) / 2;
        const minX = -(canvas.width + scaledWidth) / 2;
        const maxY = (canvas.height + scaledHeight) / 2;
        const minY = -(canvas.height + scaledHeight) / 2;

        // Apply constraints
        const constrainedX = Math.max(minX, Math.min(maxX, newX));
        const constrainedY = Math.max(minY, Math.min(maxY, newY));

        // Update position
        setMainImagePosition({ x: constrainedX, y: constrainedY });
        renderCanvas();
        return true;
      }

      // Handle main image resizing
      if (isResizingMainImage) {
        const dx = currentMouseX - mainImageResizeStartPoint.x;
        const dy = currentMouseY - mainImageResizeStartPoint.y;

        // Calculate scale factor based on the distance change
        let scaleFactor = 1;
        const startDist = Math.sqrt(
          mainImageResizeStartPoint.x * mainImageResizeStartPoint.x +
            mainImageResizeStartPoint.y * mainImageResizeStartPoint.y
        );
        const currentDist = Math.sqrt(
          currentMouseX * currentMouseX + currentMouseY * currentMouseY
        );

        if (startDist > 0) {
          scaleFactor = currentDist / startDist;
        }

        // Apply the scale factor to the initial scale
        const newScale = initialMainImageScale * scaleFactor;

        // Limit the scale to reasonable values
        const minScale = 0.1;
        const maxScale = 3.0;

        if (newScale >= minScale && newScale <= maxScale) {
          setMainImageScale(newScale);
          showResizeStatus(`Scale: ${Math.round(newScale * 100)}%`);
        }

        renderCanvas();
        return true;
      }

      return false;
    },
    [
      canvasRef,
      devMode,
      isDraggingMainImage,
      isResizingMainImage,
      mainImageDragOffset,
      mainImageResizeStartPoint,
      initialMainImageScale,
      renderCanvas,
      showResizeStatus,
      mainImage,
      mainImageScale,
    ]
  );

  // Handle mouse up for main image
  const handleMainImageMouseUp = useCallback(() => {
    if (isDraggingMainImage || isResizingMainImage) {
      setIsDraggingMainImage(false);
      setIsResizingMainImage(false);
      renderCanvas();
      return true;
    }
    return false;
  }, [isDraggingMainImage, isResizingMainImage, renderCanvas]);

  return {
    mainImagePosition,
    mainImageScale,
    isDraggingMainImage,
    isResizingMainImage,
    resetMainImage,
    handleMainImageMouseDown,
    handleMainImageMouseMove,
    handleMainImageMouseUp,
  };
};
