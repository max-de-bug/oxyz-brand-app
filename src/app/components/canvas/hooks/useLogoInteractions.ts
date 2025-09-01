"use client";

import { useState, useCallback } from "react";
import { CanvasLogo } from "@/app/store/imageStore";

interface LogoInteractionsProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  logos: CanvasLogo[];
  logoImages: Map<string, HTMLImageElement>;
  logoRects: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  updateLogo: (id: string, updates: Partial<Omit<CanvasLogo, "id">>) => void;
  selectLogo: (id: string | null) => void;
  deleteLogo: (id: string) => void;
  renderCanvas: () => void;
}

export const useLogoInteractions = ({
  canvasRef,
  logos,
  logoImages,
  logoRects,
  updateLogo,
  selectLogo,
  deleteLogo,
  renderCanvas,
}: LogoInteractionsProps) => {
  // State for logo manipulation
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingCorner, setIsResizingCorner] = useState(false);
  const [draggedLogoId, setDraggedLogoId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState(0);
  const [initialMouseDistance, setInitialMouseDistance] = useState(0);
  const [hoveredLogoId, setHoveredLogoId] = useState<string | null>(null);
  const [resizeCorner, setResizeCorner] = useState<
    "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null
  >(null);

  // Handle mouse down for logos
  const handleLogoMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return false;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check for delete button clicks first
      for (const logo of logos) {
        if (logo.isSelected) {
          const logoRect = logoRects.get(logo.id);
          if (logoRect) {
            // Check if click is on delete button (top right corner)
            const deleteButtonX = logoRect.x + logoRect.width;
            const deleteButtonY = logoRect.y;
            const deleteButtonRadius = 10;

            const distToDeleteButton = Math.sqrt(
              Math.pow(mouseX - deleteButtonX, 2) +
                Math.pow(mouseY - deleteButtonY, 2)
            );

            if (distToDeleteButton <= deleteButtonRadius) {
              // Delete the logo
              deleteLogo(logo.id);
              return true;
            }

            // Check if click is on resize handle (bottom right corner)
            const resizeHandleX = logoRect.x + logoRect.width;
            const resizeHandleY = logoRect.y + logoRect.height;
            const resizeHandleSize = 8;

            if (
              mouseX >= resizeHandleX - resizeHandleSize / 2 &&
              mouseX <= resizeHandleX + resizeHandleSize / 2 &&
              mouseY >= resizeHandleY - resizeHandleSize / 2 &&
              mouseY <= resizeHandleY + resizeHandleSize / 2
            ) {
              setIsResizing(true);
              setDraggedLogoId(logo.id);
              setInitialSize(logo.size);

              // Calculate distance from center to mouse
              const centerX = logoRect.x + logoRect.width / 2;
              const centerY = logoRect.y + logoRect.height / 2;
              setInitialMouseDistance(
                Math.sqrt(
                  Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
                )
              );

              return true;
            }
          }
        }
      }

      // Check if click is inside any logo
      let clickedLogoId: string | null = null;

      // Find the topmost logo that was clicked (last in the array)
      for (let i = logos.length - 1; i >= 0; i--) {
        const logo = logos[i];
        const logoRect = logoRects.get(logo.id);

        if (
          logoRect &&
          mouseX >= logoRect.x &&
          mouseX <= logoRect.x + logoRect.width &&
          mouseY >= logoRect.y &&
          mouseY <= logoRect.y + logoRect.height
        ) {
          clickedLogoId = logo.id;
          break; // Found the topmost logo
        }
      }

      if (clickedLogoId) {
        // Select the clicked logo
        selectLogo(clickedLogoId);

        // Start dragging
        setIsDragging(true);
        setDraggedLogoId(clickedLogoId);

        // Calculate drag offset
        const logoRect = logoRects.get(clickedLogoId);
        if (logoRect) {
          const centerX = logoRect.x + logoRect.width / 2;
          const centerY = logoRect.y + logoRect.height / 2;
          setDragOffset({
            x: mouseX - centerX,
            y: mouseY - centerY,
          });
        }

        return true;
      } else {
        // Clicked on empty space, deselect all logos
        selectLogo(null);
      }

      return false;
    },
    [canvasRef, logos, logoRects, selectLogo, deleteLogo]
  );

  // Handle mouse move for logos
  const handleLogoMouseMove = useCallback(
    (
      e: MouseEvent,
      imageBounds: { left: number; right: number; top: number; bottom: number }
    ) => {
      if (!canvasRef.current) return false;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const currentMouseX = e.clientX - rect.left;
      const currentMouseY = e.clientY - rect.top;

      // Check for hover over logos or controls
      let newHoveredLogo: string | null = null;

      for (let i = logos.length - 1; i >= 0; i--) {
        const logo = logos[i];
        const logoRect = logoRects.get(logo.id);

        if (logoRect) {
          // Check for hover over delete button
          if (logo.isSelected) {
            const deleteButtonX = logoRect.x + logoRect.width;
            const deleteButtonY = logoRect.y;
            const deleteButtonRadius = 10;

            const distToDeleteButton = Math.sqrt(
              Math.pow(currentMouseX - deleteButtonX, 2) +
                Math.pow(currentMouseY - deleteButtonY, 2)
            );

            if (distToDeleteButton <= deleteButtonRadius) {
              canvas.style.cursor = "pointer";
              newHoveredLogo = logo.id;
              break;
            }

            // Check for hover over resize handle
            const resizeHandleX = logoRect.x + logoRect.width;
            const resizeHandleY = logoRect.y + logoRect.height;
            const resizeHandleSize = 8;

            if (
              currentMouseX >= resizeHandleX - resizeHandleSize / 2 &&
              currentMouseX <= resizeHandleX + resizeHandleSize / 2 &&
              currentMouseY >= resizeHandleY - resizeHandleSize / 2 &&
              currentMouseY <= resizeHandleY + resizeHandleSize / 2
            ) {
              canvas.style.cursor = "nwse-resize";
              newHoveredLogo = logo.id;
              break;
            }
          }

          // Check for hover over logo
          if (
            currentMouseX >= logoRect.x &&
            currentMouseX <= logoRect.x + logoRect.width &&
            currentMouseY >= logoRect.y &&
            currentMouseY <= logoRect.y + logoRect.height
          ) {
            canvas.style.cursor = "move";
            newHoveredLogo = logo.id;
            break;
          }
        }
      }

      setHoveredLogoId(newHoveredLogo);

      // Handle dragging logo with constraints
      if (isDragging && draggedLogoId) {
        const logo = logos.find((l) => l.id === draggedLogoId);
        if (!logo) return false;

        const logoImg = logoImages.get(logo.id);
        if (!logoImg) return false;

        // Calculate new position as percentage
        let newX = ((currentMouseX - dragOffset.x) / canvas.width) * 100;
        let newY = ((currentMouseY - dragOffset.y) / canvas.height) * 100;

        // Calculate logo dimensions using natural image dimensions
        const logoWidth = (canvas.width * logo.size) / 100;
        const logoHeight =
          (logoImg.naturalHeight * logoWidth) / logoImg.naturalWidth;

        // Convert to percentage
        const logoWidthPercent = (logoWidth / canvas.width) * 100;
        const logoHeightPercent = (logoHeight / canvas.height) * 100;

        // Calculate logo half-dimensions for centering
        const halfWidthPercent = logoWidthPercent / 2;
        const halfHeightPercent = logoHeightPercent / 2;

        // Apply constraints to keep the logo inside the image boundaries
        newX = Math.max(
          imageBounds.left + halfWidthPercent,
          Math.min(imageBounds.right - halfWidthPercent, newX)
        );
        newY = Math.max(
          imageBounds.top + halfHeightPercent,
          Math.min(imageBounds.bottom - halfHeightPercent, newY)
        );

        // Update logo position
        updateLogo(draggedLogoId, {
          position: {
            x: newX,
            y: newY,
          },
        });

        renderCanvas();
        return true;
      }

      // Handle logo resizing
      if (isResizing && draggedLogoId) {
        const logo = logos.find((l) => l.id === draggedLogoId);
        if (!logo) return false;

        const logoRect = logoRects.get(draggedLogoId);
        if (!logoRect) return false;

        // Calculate center of logo
        const centerX = logoRect.x + logoRect.width / 2;
        const centerY = logoRect.y + logoRect.height / 2;

        // Calculate new distance from center to mouse
        const newDistance = Math.sqrt(
          Math.pow(currentMouseX - centerX, 2) +
            Math.pow(currentMouseY - centerY, 2)
        );

        // Calculate size change ratio
        const sizeRatio = newDistance / initialMouseDistance;

        // Calculate new size
        const newSize = Math.max(5, Math.min(100, initialSize * sizeRatio));

        // Update logo size
        updateLogo(draggedLogoId, { size: newSize });

        renderCanvas();
        return true;
      }

      // Handle corner resizing for logos
      if (isResizingCorner && resizeCorner && draggedLogoId) {
        const logo = logos.find((l) => l.id === draggedLogoId);
        if (!logo) return false;

        const logoRect = logoRects.get(draggedLogoId);
        if (!logoRect) return false;

        // Get logo center
        const centerX = (canvas.width * logo.position.x) / 100;
        const centerY = (canvas.height * logo.position.y) / 100;

        // Calculate distance from center to current mouse position
        const distX = Math.abs(currentMouseX - centerX);
        const distY = Math.abs(currentMouseY - centerY);

        // Use the max distance to determine the new size (keeping aspect ratio)
        const maxDist = Math.max(distX, distY);

        // Convert to percentage of canvas
        const newSize = ((maxDist * 2) / canvas.width) * 100;

        // Update logo size with constraints
        updateLogo(draggedLogoId, {
          size: Math.max(5, Math.min(100, newSize)),
        });

        renderCanvas();
        return true;
      }

      return false;
    },
    [
      canvasRef,
      logos,
      logoImages,
      logoRects,
      isDragging,
      isResizing,
      draggedLogoId,
      dragOffset,
      initialMouseDistance,
      initialSize,
      updateLogo,
      isResizingCorner,
      resizeCorner,
      renderCanvas,
    ]
  );

  // Handle mouse up for logos
  const handleLogoMouseUp = useCallback(() => {
    if (isDragging || isResizing || isResizingCorner) {
      setIsDragging(false);
      setIsResizing(false);
      setIsResizingCorner(false);
      setDraggedLogoId(null);
      setResizeCorner(null);
      renderCanvas();
      return true;
    }
    return false;
  }, [isDragging, isResizing, isResizingCorner, renderCanvas]);

  return {
    isDragging,
    isResizing,
    isResizingCorner,
    draggedLogoId,
    resizeCorner,
    hoveredLogoId,
    setResizeCorner,
    handleLogoMouseDown,
    handleLogoMouseMove,
    handleLogoMouseUp,
  };
};
