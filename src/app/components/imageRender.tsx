"use client";

import React, {
  useRef,
  useEffect,
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { useImageStore, CanvasLogo } from "@/store/imageStore";
import { useDesignStore } from "@/app/store/designStore";
import { Trash2 } from "lucide-react";

interface ImageRenderContextType {
  captureCanvas: () => string | null;
}

const ImageRenderContext = createContext<ImageRenderContextType>({
  captureCanvas: () => null,
});

export const useImageRender = () => useContext(ImageRenderContext);

const ImageRender = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mainImage, setMainImage] = useState<HTMLImageElement | null>(null);
  const [logoImages, setLogoImages] = useState<Map<string, HTMLImageElement>>(
    new Map()
  );
  const [hoveredLogoId, setHoveredLogoId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);

  // Add state to track dragging
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [draggedLogoId, setDraggedLogoId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState(0);
  const [initialMouseDistance, setInitialMouseDistance] = useState(0);

  // Add state for text dragging
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 }); // Center by default (percentage)
  const [textDragOffset, setTextDragOffset] = useState({ x: 0, y: 0 }); // Add this for text dragging offset

  // Add these state variables to track mouse position
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  // Get values from the store
  const {
    imageUrl,
    logos,
    brightness,
    contrast,
    saturation,
    sepia,
    selectLogo,
    updateLogo,
    deleteLogo,
  } = useImageStore();

  // Get text overlay from design store
  const { textOverlay } = useDesignStore();

  // Adjust canvas size based on viewport width
  useEffect(() => {
    const updateCanvasSize = () => {
      // Calculate available width (accounting for toolbar and padding)
      const viewportWidth = window.innerWidth;

      // On larger screens, make canvas narrower to leave space for toolbar
      if (viewportWidth >= 1024) {
        // lg breakpoint
        setCanvasWidth(Math.min(800, viewportWidth * 0.65)); // 65% of viewport width, max 800px
      } else if (viewportWidth >= 768) {
        // md breakpoint
        setCanvasWidth(Math.min(800, viewportWidth * 0.7)); // 70% of viewport width, max 800px
      } else {
        setCanvasWidth(Math.min(800, viewportWidth * 0.9)); // 90% of viewport width, max 800px
      }
    };

    // Initial size calculation
    updateCanvasSize();

    // Update on resize
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Memoize the calculateLogoRects function to prevent unnecessary recalculations
  const calculateLogoRects = useCallback(
    (
      canvas: HTMLCanvasElement
    ): Map<string, { x: number; y: number; width: number; height: number }> => {
      const rects = new Map();

      logos.forEach((logo) => {
        const logoImg = logoImages.get(logo.id);
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
          const logoWidth = (canvas.width * logo.size) / 100;
          const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
          const logoX = (canvas.width * logo.position.x) / 100 - logoWidth / 2;
          const logoY =
            (canvas.height * logo.position.y) / 100 - logoHeight / 2;

          rects.set(logo.id, {
            x: logoX,
            y: logoY,
            width: logoWidth,
            height: logoHeight,
          });
        }
      });

      return rects;
    },
    [logos, logoImages]
  );

  // Calculate text rectangle for hit testing
  const calculateTextRect = useCallback(
    (
      canvas: HTMLCanvasElement
    ): { x: number; y: number; width: number; height: number } | null => {
      if (!textOverlay.isVisible || !textOverlay.text) return null;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Set font properties
      const fontStyle = textOverlay.isItalic ? "italic " : "";
      const fontWeight = textOverlay.isBold ? "bold " : "";
      ctx.font = `${fontStyle}${fontWeight}${textOverlay.fontSize}px "${textOverlay.fontFamily}", sans-serif`;

      // Measure text
      const metrics = ctx.measureText(textOverlay.text);
      const textWidth = metrics.width;
      const textHeight = textOverlay.fontSize * 1.2; // Approximate height based on font size

      // Calculate position
      const textX = (canvas.width * textPosition.x) / 100 - textWidth / 2;
      const textY = (canvas.height * textPosition.y) / 100 - textHeight / 2;

      return {
        x: textX,
        y: textY - textHeight, // Adjust for baseline
        width: textWidth,
        height: textHeight,
      };
    },
    [textOverlay, textPosition]
  );

  // Load main image when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Enable CORS for Cloudinary images
      img.src = imageUrl;
      img.onload = () => {
        setMainImage(img);
      };
      img.onerror = (err) => {
        console.error("Error loading main image:", err);
        setMainImage(null);
      };
    } else {
      setMainImage(null);
    }
  }, [imageUrl]);

  // Load logo images when logos change
  useEffect(() => {
    // Create a new map to track which logos need to be loaded
    const newLogosToLoad = logos.filter((logo) => !logoImages.has(logo.id));

    // Only load new logos
    if (newLogosToLoad.length > 0) {
      newLogosToLoad.forEach((logo) => {
        console.log("Loading logo image:", logo.url);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = logo.url;

        img.onload = () => {
          console.log("Logo image loaded successfully:", logo.url);
          setLogoImages((prev) => {
            const newMap = new Map(prev);
            newMap.set(logo.id, img);
            return newMap;
          });
        };

        img.onerror = (err) => {
          console.error(`Error loading logo image ${logo.id}:`, err);
        };
      });
    }

    // Remove logos that are no longer in the store
    const currentLogoIds = new Set(logos.map((logo) => logo.id));
    const logoImagesToRemove = Array.from(logoImages.keys()).filter(
      (id) => !currentLogoIds.has(id)
    );

    if (logoImagesToRemove.length > 0) {
      setLogoImages((prev) => {
        const newMap = new Map(prev);
        logoImagesToRemove.forEach((id) => newMap.delete(id));
        return newMap;
      });
    }
  }, [logos]);

  const captureCanvas = useCallback((): string | null => {
    if (canvasRef.current) {
      return canvasRef.current.toDataURL("image/png");
    }
    return null;
  }, []);

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasWidth * 0.75; // 4:3 aspect ratio

    // Draw main image if available
    if (mainImage) {
      // Set canvas dimensions to match image aspect ratio
      const aspectRatio = mainImage.width / mainImage.height;
      if (aspectRatio > 1) {
        // Landscape
        canvas.width = canvasWidth;
        canvas.height = canvasWidth / aspectRatio;
      } else {
        // Portrait
        canvas.height = canvasWidth * 0.75;
        canvas.width = canvas.height * aspectRatio;
      }

      // Apply filters to main image
      ctx.filter = `
        brightness(${brightness}%) 
        contrast(${contrast}%) 
        saturate(${saturation}%) 
        sepia(${sepia}%)
      `;

      // Draw main image
      ctx.drawImage(mainImage, 0, 0, canvas.width, canvas.height);

      // Reset filter for logos and text
      ctx.filter = "none";
    }

    // Calculate logo rects for hit testing
    const logoRects = calculateLogoRects(canvas);

    // Draw logos
    logos.forEach((logo) => {
      const logoImg = logoImages.get(logo.id);
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const rect = logoRects.get(logo.id);
        if (rect) {
          // Draw the logo
          ctx.drawImage(logoImg, rect.x, rect.y, rect.width, rect.height);

          // Draw outline if logo is selected or hovered
          if (logo.isSelected || hoveredLogoId === logo.id) {
            ctx.strokeStyle = logo.isSelected ? "#3b82f6" : "#9ca3af";
            ctx.lineWidth = 2;
            ctx.setLineDash(logo.isSelected ? [] : [5, 5]);
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

            // Draw control points if selected
            if (logo.isSelected) {
              // Draw resize handle at bottom right
              ctx.fillStyle = "#3b82f6";
              const handleSize = 8;
              ctx.fillRect(
                rect.x + rect.width - handleSize / 2,
                rect.y + rect.height - handleSize / 2,
                handleSize,
                handleSize
              );

              // Draw delete button at top right
              ctx.fillStyle = "#ef4444";
              ctx.beginPath();
              ctx.arc(rect.x + rect.width, rect.y, 10, 0, Math.PI * 2);
              ctx.fill();

              // Draw X in delete button
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 2;
              ctx.setLineDash([]);
              ctx.beginPath();
              ctx.moveTo(rect.x + rect.width - 5, rect.y - 5);
              ctx.lineTo(rect.x + rect.width + 5, rect.y + 5);
              ctx.moveTo(rect.x + rect.width + 5, rect.y - 5);
              ctx.lineTo(rect.x + rect.width - 5, rect.y + 5);
              ctx.stroke();
            }

            ctx.setLineDash([]);
          }
        }
      }
    });

    // Draw text overlay if visible
    if (textOverlay.isVisible && textOverlay.text) {
      // Set text properties
      const fontStyle = textOverlay.isItalic ? "italic " : "";
      const fontWeight = textOverlay.isBold ? "bold " : "";
      ctx.font = `${fontStyle}${fontWeight}${textOverlay.fontSize}px "${textOverlay.fontFamily}", sans-serif`;
      ctx.fillStyle = textOverlay.color;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      // Calculate text position
      const textX = (canvas.width * textPosition.x) / 100;
      const textY = (canvas.height * textPosition.y) / 100;

      // Draw text
      ctx.fillText(textOverlay.text, textX, textY);

      // Draw text bounding box if text is being dragged or hovered
      const textRect = calculateTextRect(canvas);
      if (textRect) {
        if (isDraggingText) {
          // Draw a more prominent bounding box when dragging
          ctx.strokeStyle = "#3b82f6"; // Blue
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(
            textRect.x,
            textRect.y,
            textRect.width,
            textRect.height
          );

          // Draw control points (similar to logo)
          ctx.fillStyle = "#3b82f6";
          const handleSize = 6;

          // Draw handles at corners
          [
            { x: textRect.x, y: textRect.y }, // Top-left
            { x: textRect.x + textRect.width, y: textRect.y }, // Top-right
            { x: textRect.x, y: textRect.y + textRect.height }, // Bottom-left
            { x: textRect.x + textRect.width, y: textRect.y + textRect.height }, // Bottom-right
          ].forEach((point) => {
            ctx.fillRect(
              point.x - handleSize / 2,
              point.y - handleSize / 2,
              handleSize,
              handleSize
            );
          });
        } else if (
          mouseX >= textRect.x &&
          mouseX <= textRect.x + textRect.width &&
          mouseY >= textRect.y &&
          mouseY <= textRect.y + textRect.height
        ) {
          // Draw a subtle bounding box when hovering
          ctx.strokeStyle = "#9ca3af"; // Gray
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            textRect.x,
            textRect.y,
            textRect.width,
            textRect.height
          );
          ctx.setLineDash([]);
        }
      }
    }
  }, [
    mainImage,
    logoImages,
    logos,
    brightness,
    contrast,
    saturation,
    sepia,
    hoveredLogoId,
    calculateLogoRects,
    canvasWidth,
    textOverlay,
    textPosition,
    isDraggingText,
    calculateTextRect,
    mouseX,
    mouseY,
  ]);

  // Re-render when any relevant state changes
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle mouse down event
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      // Calculate logo rects
      const logoRects = calculateLogoRects(canvas);

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
              return;
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

              return;
            }
          }
        }
      }

      // Check if click is inside text
      if (textOverlay.isVisible && textOverlay.text) {
        const textRect = calculateTextRect(canvas);
        if (
          textRect &&
          mouseX >= textRect.x &&
          mouseX <= textRect.x + textRect.width &&
          mouseY >= textRect.y &&
          mouseY <= textRect.y + textRect.height
        ) {
          // Start dragging text
          setIsDraggingText(true);

          // Calculate drag offset for text (similar to logo dragging)
          const textCenterX = (canvas.width * textPosition.x) / 100;
          const textCenterY = (canvas.height * textPosition.y) / 100;
          setTextDragOffset({
            x: mouseX - textCenterX,
            y: mouseY - textCenterY,
          });

          // Deselect any selected logo
          selectLogo(null);
          return;
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

        console.log("Started dragging logo:", clickedLogoId);
      } else {
        // Clicked on empty space, deselect all logos
        selectLogo(null);
      }
    },
    [
      canvasRef,
      logos,
      calculateLogoRects,
      selectLogo,
      deleteLogo,
      textOverlay,
      calculateTextRect,
    ]
  );

  // Handle mouse move event
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const currentMouseX = (e.clientX - rect.left) * scaleX;
      const currentMouseY = (e.clientY - rect.top) * scaleY;

      // Update mouse position state
      setMouseX(currentMouseX);
      setMouseY(currentMouseY);

      // Update cursor based on what's under it
      canvas.style.cursor = "default";

      // Calculate logo rects
      const logoRects = calculateLogoRects(canvas);

      // Check for hover over logos or controls
      let hoveredLogo: string | null = null;

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
              hoveredLogo = logo.id;
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
              hoveredLogo = logo.id;
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
            hoveredLogo = logo.id;
            break;
          }
        }
      }

      // Check for hover over text
      if (textOverlay.isVisible && textOverlay.text) {
        const textRect = calculateTextRect(canvas);
        if (
          textRect &&
          currentMouseX >= textRect.x &&
          currentMouseX <= textRect.x + textRect.width &&
          currentMouseY >= textRect.y &&
          currentMouseY <= textRect.y + textRect.height
        ) {
          canvas.style.cursor = "move";
        }
      }

      setHoveredLogoId(hoveredLogo);

      // Handle dragging logo
      if (isDragging && draggedLogoId) {
        console.log("Dragging logo:", draggedLogoId, "Mouse position:", {
          x: currentMouseX,
          y: currentMouseY,
        });

        // Calculate new position as percentage
        const newX = ((currentMouseX - dragOffset.x) / canvas.width) * 100;
        const newY = ((currentMouseY - dragOffset.y) / canvas.height) * 100;

        // Update logo position
        updateLogo(draggedLogoId, {
          position: {
            x: Math.max(0, Math.min(100, newX)),
            y: Math.max(0, Math.min(100, newY)),
          },
        });
      }

      // Handle dragging text
      if (isDraggingText) {
        // Calculate new position as percentage (accounting for offset)
        const newX = ((currentMouseX - textDragOffset.x) / canvas.width) * 100;
        const newY = ((currentMouseY - textDragOffset.y) / canvas.height) * 100;

        // Update text position
        setTextPosition({
          x: Math.max(0, Math.min(100, newX)),
          y: Math.max(0, Math.min(100, newY)),
        });
      }

      // Handle resizing
      if (isResizing && draggedLogoId) {
        const logo = logos.find((l) => l.id === draggedLogoId);
        if (logo) {
          const logoRect = logoRects.get(draggedLogoId);
          if (logoRect) {
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
          }
        }
      }
    },
    [
      canvasRef,
      logos,
      calculateLogoRects,
      isDragging,
      isResizing,
      draggedLogoId,
      dragOffset,
      initialMouseDistance,
      initialSize,
      updateLogo,
      textOverlay,
      calculateTextRect,
      isDraggingText,
      selectLogo,
      deleteLogo,
      textDragOffset,
    ]
  );

  // Handle mouse up event
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      console.log("Stopped dragging/resizing logo");
      setIsDragging(false);
      setIsResizing(false);
      setDraggedLogoId(null);
    }

    if (isDraggingText) {
      console.log("Stopped dragging text");
      setIsDraggingText(false);
    }
  }, [isDragging, isResizing, isDraggingText]);

  // Add event listeners
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // Add keyboard shortcuts for selected logo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const selectedLogo = logos.find((logo) => logo.isSelected);
      if (!selectedLogo) return;

      const STEP = 1; // 1% movement step

      switch (e.key) {
        case "Delete":
        case "Backspace":
          deleteLogo(selectedLogo.id);
          break;
        case "ArrowUp":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              y: Math.max(0, selectedLogo.position.y - STEP),
            },
          });
          e.preventDefault();
          break;
        case "ArrowDown":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              y: Math.min(100, selectedLogo.position.y + STEP),
            },
          });
          e.preventDefault();
          break;
        case "ArrowLeft":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              x: Math.max(0, selectedLogo.position.x - STEP),
            },
          });
          e.preventDefault();
          break;
        case "ArrowRight":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              x: Math.min(100, selectedLogo.position.x + STEP),
            },
          });
          e.preventDefault();
          break;
        case "+":
        case "=":
          updateLogo(selectedLogo.id, {
            size: Math.min(100, selectedLogo.size + 5),
          });
          e.preventDefault();
          break;
        case "-":
        case "_":
          updateLogo(selectedLogo.id, {
            size: Math.max(5, selectedLogo.size - 5),
          });
          e.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [logos, updateLogo, deleteLogo]);

  // Add keyboard shortcuts for text positioning (similar to logo shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Existing logo keyboard handling...

      // Add text keyboard handling
      if (textOverlay.isVisible && textOverlay.text && isDraggingText) {
        const STEP = 1; // 1% movement step

        switch (e.key) {
          case "ArrowUp":
            setTextPosition((prev) => ({
              ...prev,
              y: Math.max(0, prev.y - STEP),
            }));
            e.preventDefault();
            break;
          case "ArrowDown":
            setTextPosition((prev) => ({
              ...prev,
              y: Math.min(100, prev.y + STEP),
            }));
            e.preventDefault();
            break;
          case "ArrowLeft":
            setTextPosition((prev) => ({
              ...prev,
              x: Math.max(0, prev.x - STEP),
            }));
            e.preventDefault();
            break;
          case "ArrowRight":
            setTextPosition((prev) => ({
              ...prev,
              x: Math.min(100, prev.x + STEP),
            }));
            e.preventDefault();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [logos, updateLogo, deleteLogo, textOverlay, isDraggingText]);

  // Create context value with memoized captureCanvas function
  const contextValue = React.useMemo(
    () => ({
      captureCanvas,
    }),
    [captureCanvas]
  );

  return (
    <ImageRenderContext.Provider value={contextValue}>
      {/* Use inline styles to control the width */}
      <div className="relative" style={{ maxWidth: `${canvasWidth}px` }}>
        <canvas ref={canvasRef} className="w-full h-auto border rounded" />
        {!mainImage && logos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Select an image or preset to display
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          {logos.length > 0 && (
            <button
              onClick={() => selectLogo(null)}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
              title="Deselect all logos"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21z" />
              </svg>
            </button>
          )}
        </div>

        {/* Help text */}
        {logos.some((logo) => logo.isSelected) && (
          <div className="mt-2 text-xs text-gray-500">
            <p>
              Tip: Use arrow keys to move logo, +/- to resize, Delete to remove
            </p>
          </div>
        )}
        {textOverlay.isVisible && textOverlay.text && (
          <div className="mt-2 text-xs text-gray-500">
            <p>Tip: Click and drag to position text</p>
          </div>
        )}
      </div>
    </ImageRenderContext.Provider>
  );
};

export default ImageRender;
